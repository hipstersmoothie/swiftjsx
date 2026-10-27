import { useEffect, useState } from "react";
import { render, VStack, Text } from "swiftjsx";

// Each check throws (or rejects) on failure; results render as "PASS name" /
// "FAIL name: message" for the Swift test to read.
const checks: Record<string, () => unknown> = {
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

function eq(actual: unknown, expected: unknown) {
  if (actual !== expected) throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function rejects(promise: Promise<unknown>, name: string) {
  try {
    await promise;
  } catch (error: any) {
    if (error?.name !== name) throw new Error(`expected ${name}, got ${error?.name}: ${error?.message}`);
    return;
  }
  throw new Error(`expected a ${name} rejection`);
}

function App() {
  const [results, setResults] = useState<string[]>([]);
  useEffect(() => {
    for (const [name, check] of Object.entries(checks)) {
      Promise.resolve()
        .then(check)
        .then(
          () => setResults((r) => [...r, `PASS ${name}`]),
          (error) => setResults((r) => [...r, `FAIL ${name}: ${error?.message ?? error}`]),
        );
    }
  }, []);
  return (
    <VStack>
      <Text>{`${results.length} of ${Object.keys(checks).length}`}</Text>
      {results.map((r) => (
        <Text key={r}>{r}</Text>
      ))}
    </VStack>
  );
}

render(<App />);
