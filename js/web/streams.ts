// A ReadableStream for fetch bodies (streaming responses: server-sent events,
// AI tokens, big downloads) and code that reads `response.body`. The core of
// the WHATWG API: a pull-free underlying source, readers, async iteration,
// cancel and tee. No byte streams, BYOB readers or pipes.

type Source<R> = {
  start?(controller: ReadableStreamDefaultController<R>): void | Promise<void>;
  pull?(controller: ReadableStreamDefaultController<R>): void | Promise<void>;
  cancel?(reason?: unknown): void | Promise<void>;
};

type ReadResult<R> = { done: false; value: R } | { done: true; value: undefined };

export class ReadableStreamDefaultController<R> {
  /** @internal */ constructor(private stream: ReadableStream<R>) {}
  get desiredSize(): number | null {
    return this.stream._state === "readable" ? Math.max(0, 1 - this.stream._queue.length) : null;
  }
  enqueue(chunk: R) {
    this.stream._enqueue(chunk);
  }
  close() {
    this.stream._close();
  }
  error(reason?: unknown) {
    this.stream._error(reason);
  }
}

export class ReadableStreamDefaultReader<R> {
  /** @internal */ _stream: ReadableStream<R> | null;
  readonly closed: Promise<void>;
  /** @internal */ _settleClosed!: { resolve: () => void; reject: (e: unknown) => void };

  constructor(stream: ReadableStream<R>) {
    if (stream.locked) throw new TypeError("ReadableStream is locked to a reader");
    this._stream = stream;
    stream._reader = this;
    this.closed = new Promise((resolve, reject) => (this._settleClosed = { resolve, reject }));
    this.closed.catch(() => {});
    if (stream._state === "closed") this._settleClosed.resolve();
    if (stream._state === "errored") this._settleClosed.reject(stream._storedError);
  }

  read(): Promise<ReadResult<R>> {
    const stream = this._stream;
    if (!stream) return Promise.reject(new TypeError("Reader was released"));
    return stream._read();
  }

  releaseLock() {
    if (!this._stream) return;
    this._stream._reader = null;
    this._stream = null;
  }

  cancel(reason?: unknown): Promise<void> {
    return this._stream ? this._stream.cancel(reason, true) : Promise.resolve();
  }
}

export class ReadableStream<R = Uint8Array> {
  /** @internal */ _state: "readable" | "closed" | "errored" = "readable";
  /** @internal */ _queue: R[] = [];
  /** @internal */ _reads: { resolve: (r: ReadResult<R>) => void; reject: (e: unknown) => void }[] = [];
  /** @internal */ _storedError: unknown;
  /** @internal */ _reader: ReadableStreamDefaultReader<R> | null = null;
  private source: Source<R>;
  private controller: ReadableStreamDefaultController<R>;
  private pulling = false;

  constructor(source: Source<R> = {}) {
    this.source = source;
    this.controller = new ReadableStreamDefaultController(this);
    Promise.resolve(source.start?.(this.controller)).then(
      () => this._pullIfNeeded(),
      (error) => this._error(error),
    );
  }

  get locked() {
    return this._reader !== null;
  }

  getReader(): ReadableStreamDefaultReader<R> {
    return new ReadableStreamDefaultReader(this);
  }

  cancel(reason?: unknown, fromReader = false): Promise<void> {
    if (this.locked && !fromReader) return Promise.reject(new TypeError("Cannot cancel a locked stream"));
    if (this._state === "closed") return Promise.resolve();
    if (this._state === "errored") return Promise.reject(this._storedError);
    this._queue = [];
    this._close();
    return Promise.resolve(this.source.cancel?.(reason)).then(() => undefined);
  }

  /** Two streams with the same chunks (e.g. `response.clone()`). */
  tee(): [ReadableStream<R>, ReadableStream<R>] {
    const reader = this.getReader();
    const branches: ReadableStreamDefaultController<R>[] = [];
    const pump = async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return branches.forEach((c) => c.close());
          branches.forEach((c) => c.enqueue(value as R));
        }
      } catch (error) {
        branches.forEach((c) => c.error(error));
      }
    };
    const a = new ReadableStream<R>({ start: (c) => void branches.push(c) });
    const b = new ReadableStream<R>({ start: (c) => void branches.push(c) });
    void Promise.resolve().then(pump);
    return [a, b];
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<R, void, undefined> {
    const reader = this.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value as R;
      }
    } finally {
      reader.releaseLock();
    }
  }

  values() {
    return this[Symbol.asyncIterator]();
  }

  /** @internal */ _read(): Promise<ReadResult<R>> {
    if (this._queue.length) {
      const value = this._queue.shift()!;
      this._pullIfNeeded();
      return Promise.resolve({ done: false, value });
    }
    if (this._state === "closed") return Promise.resolve({ done: true, value: undefined });
    if (this._state === "errored") return Promise.reject(this._storedError);
    const read = new Promise<ReadResult<R>>((resolve, reject) => this._reads.push({ resolve, reject }));
    this._pullIfNeeded();
    return read;
  }

  /** @internal */ _enqueue(chunk: R) {
    if (this._state !== "readable") throw new TypeError("Cannot enqueue into a closed stream");
    const read = this._reads.shift();
    if (read) read.resolve({ done: false, value: chunk });
    else this._queue.push(chunk);
  }

  /** @internal */ _close() {
    if (this._state !== "readable") return;
    this._state = "closed";
    // Queued chunks are still read; waiting reads are done.
    this._reads.splice(0).forEach((r) => r.resolve({ done: true, value: undefined }));
    this._reader?._settleClosed.resolve();
  }

  /** @internal */ _error(reason: unknown) {
    if (this._state !== "readable") return;
    this._state = "errored";
    this._storedError = reason;
    this._queue = [];
    this._reads.splice(0).forEach((r) => r.reject(reason));
    this._reader?._settleClosed.reject(reason);
  }

  private _pullIfNeeded() {
    if (!this.source.pull || this.pulling || this._state !== "readable") return;
    if (!this._reads.length && this._queue.length) return;
    this.pulling = true;
    Promise.resolve(this.source.pull(this.controller)).then(
      () => {
        this.pulling = false;
        if (this._reads.length) this._pullIfNeeded();
      },
      (error) => this._error(error),
    );
  }
}

/** Every chunk, concatenated (for text() / json() on a streamed body). */
export async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let length = 0;
  for await (const chunk of stream) {
    chunks.push(chunk);
    length += chunk.byteLength;
  }
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
