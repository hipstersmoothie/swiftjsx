// The dev server: apps in Debug builds (simulator and devices) load app.js
// from here and get every rebuild as a Fast Refresh update.
//
//   GET /status                          200 "swiftjsx"
//   GET /app.js?after=<n>&session=<id>   the bundle once there's a build newer
//                                        than <n> (200), its errors (500), or 204
//                                        after 25 s with nothing new
//
// Responses carry X-SwiftJSX-Version and X-SwiftJSX-Session; a new session (the
// server restarted) answers right away. See Sources/SwiftJSX/DevServer.swift.

import http from "node:http";
import os from "node:os";
import { randomUUID } from "node:crypto";

export function startDevServer({ port = 8081 } = {}) {
  const session = randomUUID();
  let version = 0;
  let latest = null; // { code } or { error }
  let waiting = [];

  const respond = (res) => {
    const headers = { "X-SwiftJSX-Version": String(version), "X-SwiftJSX-Session": session, "Cache-Control": "no-store" };
    if (latest?.error) {
      res.writeHead(500, { ...headers, "Content-Type": "text/plain; charset=utf-8" });
      res.end(latest.error);
    } else {
      res.writeHead(200, { ...headers, "Content-Type": "application/javascript; charset=utf-8" });
      res.end(latest.code);
    }
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/status") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("swiftjsx");
      return;
    }
    if (url.pathname !== "/app.js") {
      res.writeHead(404);
      res.end();
      return;
    }
    const after = Number(url.searchParams.get("after") ?? 0);
    const sameSession = url.searchParams.get("session") === session;
    if (latest && (!sameSession || version > after)) return respond(res);
    const waiter = { res, timer: setTimeout(() => finish(204), 25_000) };
    const finish = (status) => {
      clearTimeout(waiter.timer);
      waiting = waiting.filter((w) => w !== waiter);
      if (status === 204) {
        res.writeHead(204, { "X-SwiftJSX-Version": String(version), "X-SwiftJSX-Session": session });
        res.end();
      } else {
        respond(res);
      }
    };
    waiter.finish = finish;
    waiting.push(waiter);
    req.on("close", () => {
      clearTimeout(waiter.timer);
      waiting = waiting.filter((w) => w !== waiter);
    });
  });

  server.listen(port, "0.0.0.0", () => {
    const addresses = lanAddresses();
    console.log(`\nswiftjsx dev server on port ${port}`);
    console.log(`  simulator: http://127.0.0.1:${port}`);
    for (const address of addresses) console.log(`  devices:   http://${address}:${port}`);
    console.log("");
  });

  return {
    /** A new build: `{ code }` or `{ error }`. */
    update(bundle) {
      version += 1;
      latest = bundle;
      if (bundle.error) console.log(`[swiftjsx] build failed; devices show the error`);
      else if (waiting.length) console.log(`[swiftjsx] sent update ${version} to ${waiting.length} app${waiting.length === 1 ? "" : "s"}`);
      [...waiting].forEach((w) => w.finish(200));
    },
    close() {
      server.close();
    },
  };
}

/** This Mac's IPv4 addresses on the local network. */
export function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
}
