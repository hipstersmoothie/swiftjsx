import { runChecks, eq, rejects, type Checks } from "./support/checks";

const checks: Checks = {
  async "fetch json"() {
    const response = await fetch("https://mock.test/json?x=1");
    eq(response.status, 200);
    eq(response.ok, true);
    eq(response.headers.get("X-Test"), "yes");
    eq(response.url, "https://mock.test/json?x=1");
    const body = await response.json();
    eq(body.hello, "world");
    eq(body.query, "x=1");
  },
  async "fetch post echo"() {
    const response = await fetch("https://mock.test/echo", {
      method: "post",
      headers: { "Content-Type": "application/json", "X-Custom": "abc" },
      body: JSON.stringify({ a: 1 }),
    });
    const body = await response.json();
    eq(body.method, "POST");
    eq(body.contentType, "application/json");
    eq(body.custom, "abc");
    eq(body.body, '{"a":1}');
  },
  async "fetch binary + url-encoded"() {
    const response = await fetch(new Request("https://mock.test/echo", { method: "PUT", body: new Uint8Array([104, 105]) }));
    eq((await response.json()).body, "hi");
    const form = await fetch("https://mock.test/echo", { method: "POST", body: new URLSearchParams({ q: "a b", n: "1" }) });
    const echoed = await form.json();
    eq(echoed.body, "q=a+b&n=1");
    eq(echoed.contentType, "application/x-www-form-urlencoded;charset=UTF-8");
  },
  async "fetch status and errors"() {
    eq((await fetch("https://mock.test/status/404")).status, 404);
    await rejects(fetch("not a url"), "TypeError");
    await rejects(fetch("https://mock.test/fail"), "TypeError");
  },
  async "fetch abort"() {
    const controller = new AbortController();
    const request = fetch("https://mock.test/slow", { signal: controller.signal });
    setTimeout(() => controller.abort(), 50);
    await rejects(request, "AbortError");
    await rejects(fetch("https://mock.test/json", { signal: AbortSignal.abort() }), "AbortError");
  },
  async "fetch streams the body"() {
    const response = await fetch("https://mock.test/stream");
    const reader = response.body!.getReader();
    const chunks: string[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new TextDecoder().decode(value));
    }
    eq(chunks.join(""), "one two three");
    eq(chunks.length > 1, true);
    // text() on a streamed body, and clone().
    const again = await fetch("https://mock.test/stream");
    const copy = again.clone();
    eq(await again.text(), "one two three");
    eq(await copy.text(), "one two three");
    // A body built locally streams too.
    let local = "";
    for await (const chunk of new Response("hi").body!) local += new TextDecoder().decode(chunk);
    eq(local, "hi");
  },
  async "fetch FormData"() {
    const form = new FormData();
    form.append("note", "hello");
    form.append("photo", new Blob(["PNGDATA"], { type: "image/png" }), "me.png");
    eq(form.get("note"), "hello");
    eq((form.get("photo") as File).name, "me.png");
    const echo = await (await fetch("https://mock.test/echo", { method: "POST", body: form })).json();
    eq(echo.contentType.startsWith("multipart/form-data; boundary="), true);
    eq(echo.body.includes('name="note"\r\n\r\nhello'), true);
    eq(echo.body.includes('filename="me.png"\r\nContent-Type: image/png\r\n\r\nPNGDATA'), true);
  },
  async "requestAnimationFrame"() {
    const times: number[] = [];
    const frame = new Promise<void>((resolve) => {
      requestAnimationFrame((t) => times.push(t));
      const cancelled = requestAnimationFrame(() => times.push(-1));
      cancelAnimationFrame(cancelled);
      requestAnimationFrame((t) => {
        times.push(t);
        resolve();
      });
    });
    await frame;
    eq(times.length, 2);
    eq(times[0], times[1]);
  },
  async "fetch data: url"() {
    eq(await (await fetch("data:text/plain;base64,aGVsbG8=")).text(), "hello");
  },
  async "response body helpers"() {
    const response = Response.json({ ok: true }, { status: 201 });
    eq(response.status, 201);
    eq(response.headers.get("content-type"), "application/json");
    const copy = response.clone();
    eq((await response.json()).ok, true);
    eq(response.bodyUsed, true);
    eq(new Uint8Array(await copy.arrayBuffer()).length, 11);
    await rejects(response.text(), "TypeError");
    eq(await (await new Response("héllo").blob()).size, 6);
  },
  async "websocket echo"() {
    const port = await (await fetch("https://mock.test/wsport")).text();
    const socket = new WebSocket(`ws://localhost:${port}`);
    socket.binaryType = "arraybuffer";
    const events: string[] = [];
    await new Promise<void>((resolve, reject) => {
      socket.onerror = () => reject(new Error("socket error"));
      socket.onopen = () => {
        events.push("open");
        socket.send("hello");
        socket.send(new Uint8Array([1, 2, 3]));
      };
      socket.onmessage = (event) => {
        events.push(typeof event.data === "string" ? `text:${event.data}` : `binary:${new Uint8Array(event.data as ArrayBuffer).join(",")}`);
        if (events.length === 3) socket.close(1000, "done");
      };
      socket.addEventListener("close", (event) => {
        events.push(`close:${(event as CloseEvent).code}`);
        resolve();
      });
    });
    eq(events.join(" "), "open text:hello binary:1,2,3 close:1000");
    eq(socket.readyState, WebSocket.CLOSED);
  },
  async "websocket refused"() {
    const socket = new WebSocket("ws://localhost:1");
    const events: string[] = [];
    await new Promise<void>((resolve) => {
      socket.onerror = () => events.push("error");
      socket.onclose = (event) => {
        events.push(`close:${event.code}:${event.wasClean}`);
        resolve();
      };
    });
    eq(events.join(" "), "error close:1006:false");
  },
  "headers"() {
    const headers = new Headers({ "Content-Type": "a" });
    headers.append("x-multi", "1");
    headers.append("X-Multi", "2");
    eq(headers.get("x-multi"), "1, 2");
    eq([...headers.keys()].join(), "content-type,x-multi");
  },
  "text encoding"() {
    const bytes = new TextEncoder().encode("héllo 👋");
    eq(bytes.length, 11);
    eq(new TextDecoder().decode(bytes), "héllo 👋");
    eq(new TextDecoder().decode(new DataView(bytes.buffer, 0, 1)), "h");
    let threw = false;
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array([0xff]));
    } catch {
      threw = true;
    }
    eq(threw, true);
    // Streaming: characters split across chunks.
    const streaming = new TextDecoder();
    const parts = [bytes.subarray(0, 2), bytes.subarray(2, 8), bytes.subarray(8)];
    eq(parts.map((p) => streaming.decode(p, { stream: true })).join("") + streaming.decode(), "héllo 👋");
    eq(new TextDecoder().decode(new Uint8Array([0xef, 0xbb, 0xbf, 0x61])), "a");
    eq(new TextDecoder("utf-16le").decode(new Uint8Array([0x68, 0, 0x3d, 0xd8, 0x4b, 0xdc])), "h👋");
    eq(new TextDecoder("utf-16be").decode(new Uint8Array([0, 0x68, 0xd8, 0x3d])), "h\ufffd");
    const utf16 = new TextDecoder("utf-16le");
    eq(utf16.decode(new Uint8Array([0x68, 0, 0x3d]), { stream: true }) + utf16.decode(new Uint8Array([0xd8, 0x4b, 0xdc])), "h👋");
    eq(new TextDecoder("latin1").decode(new Uint8Array([0x63, 0x61, 0x66, 0xe9, 0x80])), "café€");
    eq(new TextDecoder("ISO-8859-1").encoding, "windows-1252");
    eq(btoa("hello"), "aGVsbG8=");
    eq(atob("aGVsbG8="), "hello");
  },
  "url"() {
    const url = new URL("../b/c?x=1#top", "https://Example.com:443/a/z/");
    eq(url.href, "https://example.com/a/b/c?x=1#top");
    eq(url.origin, "https://example.com");
    eq(url.searchParams.get("x"), "1");
    url.searchParams.append("q", "a b&c");
    eq(url.search, "?x=1&q=a+b%26c");
    url.hash = "";
    eq(url.href, "https://example.com/a/b/c?x=1&q=a+b%26c");
    eq(new URL("http://localhost:8080/p").host, "localhost:8080");
    eq(URL.canParse("nope"), false);
    eq(new URLSearchParams([["a", "1"], ["a", "2"]]).getAll("a").join(), "1,2");
  },
  "crypto"() {
    const values = crypto.getRandomValues(new Uint32Array(8));
    eq(values.some((v) => v !== 0), true);
    eq(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(crypto.randomUUID()), true);
  },
  "storage"() {
    localStorage.setItem("count", "1");
    eq(localStorage.getItem("count"), "1");
    eq(localStorage.length, 1);
    localStorage.removeItem("count");
    eq(localStorage.getItem("count"), null);
    sessionStorage.setItem("s", "v");
    eq(sessionStorage.getItem("s"), "v");
  },
  "structuredClone"() {
    const source: any = { date: new Date(5), map: new Map([[1, { a: [1, 2] }]]), bytes: new Uint8Array([1, 2]) };
    source.self = source;
    const copy = structuredClone(source);
    eq(copy.self, copy);
    eq(copy.date.getTime(), 5);
    eq(copy.map.get(1).a[1], 2);
    eq(copy.bytes[1], 2);
    eq(copy.map === source.map, false);
  },
  "events"() {
    const target = new EventTarget();
    let calls = 0;
    target.addEventListener("ping", () => calls++, { once: true });
    target.dispatchEvent(new Event("ping"));
    target.dispatchEvent(new Event("ping"));
    eq(calls, 1);
    eq(typeof window.addEventListener, "function");
    eq(navigator.onLine, true);
  },
};

runChecks(checks);
