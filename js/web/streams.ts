// A ReadableStream for fetch bodies (streaming responses: server-sent events,
// AI tokens, big downloads) and code that reads `response.body`. The core of
// the WHATWG API: underlying sources, readers, async iteration, cancel, tee,
// pipes, WritableStream and TransformStream (TextDecoderStream for
// `body.pipeThrough(new TextDecoderStream())`). No byte streams, BYOB readers
// or backpressure beyond one queued chunk.

import { TextDecoder, TextEncoder } from "./encoding";

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

  /** A stream of an iterable's or async iterable's values. */
  static from<T>(source: Iterable<T> | AsyncIterable<T>): ReadableStream<T> {
    const iterator = Symbol.asyncIterator in source ? (source as AsyncIterable<T>)[Symbol.asyncIterator]() : (source as Iterable<T>)[Symbol.iterator]();
    return new ReadableStream<T>({
      async pull(controller) {
        const { done, value } = await iterator.next();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      async cancel(reason) {
        await iterator.return?.(reason);
      },
    });
  }

  /** Writes every chunk to `destination`, then closes it (unless `preventClose`). */
  async pipeTo(destination: WritableStream<R>, options: { preventClose?: boolean; preventAbort?: boolean; preventCancel?: boolean; signal?: AbortSignal } = {}): Promise<void> {
    const reader = this.getReader();
    const writer = destination.getWriter();
    const abort = () => void reader.cancel(options.signal?.reason);
    options.signal?.addEventListener("abort", abort);
    try {
      for (;;) {
        if (options.signal?.aborted) throw options.signal.reason;
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value as R);
      }
      if (!options.preventClose) await writer.close();
    } catch (error) {
      if (!options.preventAbort) await writer.abort(error).catch(() => {});
      if (!options.preventCancel) await reader.cancel(error).catch(() => {});
      throw error;
    } finally {
      options.signal?.removeEventListener("abort", abort);
      reader.releaseLock();
      writer.releaseLock();
    }
  }

  /** `body.pipeThrough(new TextDecoderStream())`: this stream through a transform. */
  pipeThrough<T>(transform: { writable: WritableStream<R>; readable: ReadableStream<T> }, options?: { signal?: AbortSignal }): ReadableStream<T> {
    this.pipeTo(transform.writable, options).catch(() => {});
    return transform.readable;
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

// MARK: Writable streams

type Sink<W> = {
  start?(controller: WritableStreamDefaultController): void | Promise<void>;
  write?(chunk: W, controller: WritableStreamDefaultController): void | Promise<void>;
  close?(): void | Promise<void>;
  abort?(reason?: unknown): void | Promise<void>;
};

export class WritableStreamDefaultController {
  /** @internal */ constructor(private stream: WritableStream<any>) {}
  readonly signal = new AbortController().signal;
  error(reason?: unknown) {
    this.stream._fail(reason);
  }
}

/** Writes run one at a time, in order, through the sink. */
export class WritableStream<W = unknown> {
  /** @internal */ _state: "writable" | "closed" | "errored" = "writable";
  /** @internal */ _storedError: unknown;
  /** @internal */ _writer: WritableStreamDefaultWriter<W> | null = null;
  /** @internal */ _chain: Promise<void>;
  /** @internal */ _sink: Sink<W>;
  /** @internal */ _controller: WritableStreamDefaultController;

  constructor(sink: Sink<W> = {}) {
    this._sink = sink;
    this._controller = new WritableStreamDefaultController(this);
    this._chain = Promise.resolve(sink.start?.(this._controller)).then(() => undefined);
    this._chain.catch((error) => this._fail(error));
  }

  get locked() {
    return this._writer !== null;
  }

  getWriter(): WritableStreamDefaultWriter<W> {
    return new WritableStreamDefaultWriter(this);
  }

  close(): Promise<void> {
    if (this.locked) return Promise.reject(new TypeError("Cannot close a locked stream"));
    return this._close();
  }

  abort(reason?: unknown): Promise<void> {
    if (this.locked) return Promise.reject(new TypeError("Cannot abort a locked stream"));
    return this._abort(reason);
  }

  /** @internal */ _write(chunk: W): Promise<void> {
    if (this._state !== "writable") return Promise.reject(this._state === "errored" ? this._storedError : new TypeError("The stream is closed"));
    const next = this._chain.then(() => {
      if (this._state === "errored") throw this._storedError;
      return this._sink.write?.(chunk, this._controller);
    });
    this._chain = next.catch((error) => this._fail(error));
    return next;
  }

  /** @internal */ _close(): Promise<void> {
    if (this._state !== "writable") return Promise.reject(new TypeError("The stream is closed or errored"));
    this._state = "closed";
    const done = this._chain.then(() => this._sink.close?.()).then(() => this._writer?._settleClosed.resolve());
    done.catch((error) => this._fail(error));
    return done;
  }

  /** @internal */ _abort(reason?: unknown): Promise<void> {
    if (this._state === "closed") return Promise.resolve();
    this._fail(reason);
    return Promise.resolve(this._sink.abort?.(reason)).then(() => undefined);
  }

  /** @internal */ _fail(reason: unknown) {
    if (this._state === "errored") return;
    this._state = "errored";
    this._storedError = reason;
    this._writer?._settleClosed.reject(reason);
  }
}

export class WritableStreamDefaultWriter<W> {
  /** @internal */ _stream: WritableStream<W> | null;
  readonly closed: Promise<void>;
  readonly ready = Promise.resolve();
  /** @internal */ _settleClosed!: { resolve: () => void; reject: (e: unknown) => void };

  constructor(stream: WritableStream<W>) {
    if (stream.locked) throw new TypeError("WritableStream is locked to a writer");
    this._stream = stream;
    stream._writer = this;
    this.closed = new Promise((resolve, reject) => (this._settleClosed = { resolve, reject }));
    this.closed.catch(() => {});
  }

  get desiredSize(): number | null {
    return this._stream?._state === "writable" ? 1 : this._stream?._state === "closed" ? 0 : null;
  }

  write(chunk: W): Promise<void> {
    return this._stream ? this._stream._write(chunk) : Promise.reject(new TypeError("Writer was released"));
  }

  close(): Promise<void> {
    return this._stream ? this._stream._close() : Promise.reject(new TypeError("Writer was released"));
  }

  abort(reason?: unknown): Promise<void> {
    return this._stream ? this._stream._abort(reason) : Promise.reject(new TypeError("Writer was released"));
  }

  releaseLock() {
    if (!this._stream) return;
    this._stream._writer = null;
    this._stream = null;
  }
}

// MARK: Transform streams

type Transformer<I, O> = {
  start?(controller: TransformStreamDefaultController<O>): void | Promise<void>;
  transform?(chunk: I, controller: TransformStreamDefaultController<O>): void | Promise<void>;
  flush?(controller: TransformStreamDefaultController<O>): void | Promise<void>;
};

export class TransformStreamDefaultController<O> {
  /** @internal */ constructor(private readableController: () => ReadableStreamDefaultController<O>, private onError: (reason: unknown) => void) {}
  get desiredSize() {
    return this.readableController().desiredSize;
  }
  enqueue(chunk: O) {
    this.readableController().enqueue(chunk);
  }
  error(reason?: unknown) {
    this.onError(reason);
  }
  /** Closes the readable side; further writes fail. */
  terminate() {
    this.readableController().close();
  }
}

/** A writable side whose chunks come out of the readable side, transformed. */
export class TransformStream<I = unknown, O = unknown> {
  readonly readable: ReadableStream<O>;
  readonly writable: WritableStream<I>;

  constructor(transformer: Transformer<I, O> = {}) {
    let readableController!: ReadableStreamDefaultController<O>;
    this.readable = new ReadableStream<O>({ start: (c) => void (readableController = c) });
    const controller = new TransformStreamDefaultController<O>(
      () => readableController,
      (reason) => {
        readableController.error(reason);
        this.writable._fail(reason);
      },
    );
    this.writable = new WritableStream<I>({
      start: () => transformer.start?.(controller),
      write: (chunk) => (transformer.transform ? transformer.transform(chunk, controller) : controller.enqueue(chunk as unknown as O)),
      close: async () => {
        await transformer.flush?.(controller);
        readableController.close();
      },
      abort: (reason) => readableController.error(reason),
    });
  }
}

/** Bytes in, text out (characters split across chunks are kept whole). */
export class TextDecoderStream extends TransformStream<Uint8Array | ArrayBuffer, string> {
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  constructor(label = "utf-8", options: { fatal?: boolean; ignoreBOM?: boolean } = {}) {
    const decoder = new TextDecoder(label, options);
    super({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        if (text) controller.enqueue(text);
      },
      flush(controller) {
        const text = decoder.decode();
        if (text) controller.enqueue(text);
      },
    });
    this.encoding = decoder.encoding;
    this.fatal = decoder.fatal;
    this.ignoreBOM = decoder.ignoreBOM;
  }
}

/** Text in, UTF-8 bytes out. */
export class TextEncoderStream extends TransformStream<string, Uint8Array> {
  readonly encoding = "utf-8";
  constructor() {
    const encoder = new TextEncoder();
    // A lone high surrogate at a chunk's end waits for its pair.
    let pending = "";
    super({
      transform(chunk, controller) {
        let text = pending + String(chunk);
        pending = "";
        const last = text.charCodeAt(text.length - 1);
        if (last >= 0xd800 && last <= 0xdbff) {
          pending = text.slice(-1);
          text = text.slice(0, -1);
        }
        if (text) controller.enqueue(encoder.encode(text));
      },
      flush(controller) {
        if (pending) controller.enqueue(encoder.encode("\ufffd"));
      },
    });
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
