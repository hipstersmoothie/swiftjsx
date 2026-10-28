import Foundation
import JavaScriptCore
import Security
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

// Native halves of the web APIs (fetch, crypto, localStorage, URL parsing,
// UTF-8). The JS halves are in js/web/, bundled into the runtime; they call
// these through the `__web` object. Everything here is called on the JS thread.

extension JSEngine {
    func installWeb(in ctx: JSContext) {
        let web = JSValue(newObjectIn: ctx)!

        // fetch(id, { method, url, headers, body }) → __swiftjsx_fetchDone(id, error, response, body)
        let fetch: @convention(block) (Int, JSValue) -> Void = { [weak self] id, request in
            self?.startFetch(id, request)
        }
        let abort: @convention(block) (Int) -> Void = { [weak self] id in
            self?.fetches.cancel(id)
        }

        let encode: @convention(block) (String) -> JSValue = { string in
            Self.uint8Array(Data(string.utf8), in: JSContext.current())
        }
        let decode: @convention(block) (JSValue, Bool) -> JSValue = { bytes, fatal in
            let data = Self.bytes(of: bytes) ?? Data()
            if fatal, String(validatingUTF8Data: data) == nil {
                return JSValue(nullIn: JSContext.current())
            }
            return JSValue(object: String(decoding: data, as: UTF8.self), in: JSContext.current())
        }

        let random: @convention(block) (JSValue) -> Void = { array in
            Self.withBytes(of: array) { pointer, count in
                _ = SecRandomCopyBytes(kSecRandomDefault, count, pointer)
            }
        }
        let uuid: @convention(block) () -> String = { UUID().uuidString.lowercased() }

        let storage: @convention(block) (String, JSValue, JSValue) -> JSValue = { op, key, value in
            let ctx = JSContext.current()!
            let store = WebStorage.shared
            switch op {
            case "get": return store.get(key.toString()).map { JSValue(object: $0, in: ctx) } ?? JSValue(nullIn: ctx)
            case "set": return JSValue(bool: store.set(key.toString(), value.toString()), in: ctx)
            case "remove": store.remove(key.toString())
            case "clear": store.clear()
            case "keys": return JSValue(object: store.keys(), in: ctx)
            default: break
            }
            return JSValue(undefinedIn: ctx)
        }

        let parseURL: @convention(block) (String, JSValue) -> JSValue = { input, base in
            let ctx = JSContext.current()!
            let baseURL = base.isString ? URL(string: base.toString()) : nil
            if base.isString, baseURL?.scheme == nil { return JSValue(nullIn: ctx) }
            guard let parts = WebURL.parse(input, base: baseURL) else { return JSValue(nullIn: ctx) }
            return JSValue(object: parts, in: ctx)
        }

        sockets.engine = self
        let wsOpen: @convention(block) (Int, String, JSValue) -> Void = { [weak self] id, url, protocols in
            guard let url = URL(string: url) else { return }
            self?.sockets.open(id, url: url, protocols: protocols.toArray() as? [String] ?? [])
        }
        let wsSend: @convention(block) (Int, JSValue) -> Void = { [weak self] id, data in
            let message: URLSessionWebSocketTask.Message = data.isString ? .string(data.toString()) : .data(Self.bytes(of: data) ?? Data())
            self?.sockets.send(id, message)
        }
        let wsClose: @convention(block) (Int, Int, String) -> Void = { [weak self] id, code, reason in
            self?.sockets.close(id, code: code, reason: reason)
        }
        web.setObject(wsOpen, forKeyedSubscript: "wsOpen" as NSString)
        web.setObject(wsSend, forKeyedSubscript: "wsSend" as NSString)
        web.setObject(wsClose, forKeyedSubscript: "wsClose" as NSString)
        web.setObject(fetch, forKeyedSubscript: "fetch" as NSString)
        web.setObject(abort, forKeyedSubscript: "abort" as NSString)
        web.setObject(encode, forKeyedSubscript: "encodeUTF8" as NSString)
        web.setObject(decode, forKeyedSubscript: "decodeUTF8" as NSString)
        web.setObject(random, forKeyedSubscript: "randomFill" as NSString)
        web.setObject(uuid, forKeyedSubscript: "randomUUID" as NSString)
        web.setObject(storage, forKeyedSubscript: "storage" as NSString)
        web.setObject(parseURL, forKeyedSubscript: "parseURL" as NSString)
        web.setObject(Self.userAgent, forKeyedSubscript: "userAgent" as NSString)
        web.setObject(Locale.preferredLanguages, forKeyedSubscript: "languages" as NSString)
        ctx.setObject(web, forKeyedSubscript: "__web" as NSString)
    }

    static let userAgent = "SwiftJSX/0.1 (\(ProcessInfo.processInfo.operatingSystemVersionString))"

    // MARK: fetch

    private func startFetch(_ id: Int, _ request: JSValue) {
        func string(_ key: String) -> String? {
            let v = request.objectForKeyedSubscript(key)
            return v?.isString == true ? v?.toString() : nil
        }
        guard let urlString = string("url"), let url = URL(string: urlString) else {
            return fetchFailed(id, "TypeError", "Invalid URL: \(string("url") ?? "")")
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = string("method") ?? "GET"
        if let headers = request.objectForKeyedSubscript("headers")?.toArray() as? [[String]] {
            for pair in headers where pair.count == 2 {
                urlRequest.addValue(pair[1], forHTTPHeaderField: pair[0])
            }
        }
        if let body = request.objectForKeyedSubscript("body"), !body.isUndefined, !body.isNull {
            urlRequest.httpBody = body.isString ? Data(body.toString().utf8) : Self.bytes(of: body)
        }
        // Streamed: the headers, then each chunk, then the end.
        let task = WebHost.session.dataTask(with: urlRequest)
        let stream = FetchStream(id: id, requested: url, host: self)
        stream.reportsUpload = request.objectForKeyedSubscript("uploadProgress")?.toBool() == true
        task.delegate = stream
        fetches.add(id, task)
        task.resume()
    }

    fileprivate func fetchHead(_ id: Int, url: URL, requested: URL, status: Int, headers: [[String]]) {
        let response = UncheckedSendable([
            "status": status,
            "statusText": HTTPURLResponse.localizedString(forStatusCode: status).capitalized,
            "url": url.absoluteString,
            "redirected": url != requested,
            "headers": headers,
        ] as [String: Any])
        perform { ctx in
            ctx.objectForKeyedSubscript("__swiftjsx_fetchHead")?.call(withArguments: [id, response.value])
        }
    }

    fileprivate func fetchUpload(_ id: Int, sent: Int64, total: Int64) {
        perform { ctx in
            ctx.objectForKeyedSubscript("__swiftjsx_fetchUpload")?.call(withArguments: [id, sent, total])
        }
    }

    fileprivate func fetchChunk(_ id: Int, _ data: Data) {
        let chunk = UncheckedSendable(data)
        perform { ctx in
            ctx.objectForKeyedSubscript("__swiftjsx_fetchChunk")?.call(withArguments: [id, Self.arrayBuffer(chunk.value, in: ctx)])
        }
    }

    fileprivate func fetchFinished(_ id: Int) {
        fetches.remove(id)
        perform { ctx in
            ctx.objectForKeyedSubscript("__swiftjsx_fetchDone")?.call(withArguments: [id, NSNull()])
        }
    }

    private func fetchFailed(_ id: Int, _ name: String, _ message: String) {
        fetches.remove(id)
        perform { ctx in
            ctx.objectForKeyedSubscript("__swiftjsx_fetchDone")?.call(withArguments: [id, ["name": name, "message": message]])
        }
    }

    /// One fetch's URLSession callbacks (a per-task delegate).
    private final class FetchStream: NSObject, URLSessionDataDelegate, @unchecked Sendable {
        let id: Int
        let requested: URL
        weak var host: JSEngine?
        var reportsUpload = false

        init(id: Int, requested: URL, host: JSEngine) {
            self.id = id
            self.requested = requested
            self.host = host
        }

        func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
                        completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
            let url = response.url ?? requested
            if let http = response as? HTTPURLResponse {
                let headers = http.allHeaderFields.compactMap { key, value -> [String]? in
                    guard let key = key as? String else { return nil }
                    return [key.lowercased(), "\(value)"]
                }
                host?.fetchHead(id, url: url, requested: requested, status: http.statusCode, headers: headers)
            } else {
                // file: and data: URLs
                host?.fetchHead(id, url: url, requested: requested, status: 200,
                                headers: response.mimeType.map { [["content-type", $0]] } ?? [])
            }
            completionHandler(.allow)
        }

        func urlSession(_ session: URLSession, task: URLSessionTask, didSendBodyData bytesSent: Int64,
                        totalBytesSent: Int64, totalBytesExpectedToSend: Int64) {
            if reportsUpload { host?.fetchUpload(id, sent: totalBytesSent, total: totalBytesExpectedToSend) }
        }

        func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
            host?.fetchChunk(id, data)
        }

        func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
            guard let host else { return }
            guard let error = error as? URLError else {
                if let error { return host.fetchFailed(id, "TypeError", "Network request failed: \(error.localizedDescription)") }
                return host.fetchFinished(id)
            }
            error.code == .cancelled
                ? host.fetchFailed(id, "AbortError", "The operation was aborted.")
                : host.fetchFailed(id, "TypeError", "Network request failed: \(error.localizedDescription)")
        }
    }

    // MARK: Bytes

    /// A copy of the bytes of an ArrayBuffer or typed array.
    static func bytes(of value: JSValue) -> Data? {
        var data: Data?
        withBytes(of: value) { pointer, count in data = Data(bytes: pointer, count: count) }
        return data
    }

    /// The live bytes of an ArrayBuffer or typed array (nil for anything else).
    static func withBytes(of value: JSValue, _ body: (UnsafeMutableRawPointer, Int) -> Void) {
        guard let ctx = value.context?.jsGlobalContextRef, value.isObject else { return }
        let object = value.jsValueRef
        switch JSValueGetTypedArrayType(ctx, object, nil) {
        case kJSTypedArrayTypeNone:
            return
        case kJSTypedArrayTypeArrayBuffer:
            let count = JSObjectGetArrayBufferByteLength(ctx, object, nil)
            if let pointer = JSObjectGetArrayBufferBytesPtr(ctx, object, nil) { body(pointer, count) }
        default:
            // The pointer is to the start of the backing buffer: a view
            // (`bytes.subarray(4)`) starts byteOffset into it.
            let count = JSObjectGetTypedArrayByteLength(ctx, object, nil)
            let offset = JSObjectGetTypedArrayByteOffset(ctx, object, nil)
            if let pointer = JSObjectGetTypedArrayBytesPtr(ctx, object, nil) { body(pointer + offset, count) }
        }
    }

    static func arrayBuffer(_ data: Data, in ctx: JSContext) -> JSValue {
        let count = data.count
        let pointer = UnsafeMutableRawPointer.allocate(byteCount: max(count, 1), alignment: 16)
        data.copyBytes(to: pointer.assumingMemoryBound(to: UInt8.self), count: count)
        let ref = JSObjectMakeArrayBufferWithBytesNoCopy(ctx.jsGlobalContextRef, pointer, count, { bytes, _ in
            bytes?.deallocate()
        }, nil, nil)
        return JSValue(jsValueRef: ref, in: ctx)
    }

    static func uint8Array(_ data: Data, in ctx: JSContext?) -> JSValue {
        guard let ctx else { return JSValue() }
        let buffer = arrayBuffer(data, in: ctx)
        return ctx.objectForKeyedSubscript("Uint8Array")!.construct(withArguments: [buffer])
    }
}

/// In-flight fetches, so `AbortController` can cancel them.
final class FetchTasks: @unchecked Sendable {
    private let lock = NSLock()
    private var tasks: [Int: URLSessionTask] = [:]

    func add(_ id: Int, _ task: URLSessionTask) { lock.withLock { tasks[id] = task } }
    func remove(_ id: Int) { lock.withLock { _ = tasks.removeValue(forKey: id) } }
    func cancel(_ id: Int) { lock.withLock { tasks[id] }?.cancel() }
}

enum WebHost {
    /// The session `fetch` uses. Tests swap in one with a mock URLProtocol.
    nonisolated(unsafe) static var session = URLSession(configuration: .default)
}

/// `localStorage`: in memory, saved to a JSON file in Application Support
/// on a background queue (coalesced, at most every 200 ms, and right away
/// when the app leaves the foreground). Like browsers, about 10 MB.
final class WebStorage: @unchecked Sendable {
    nonisolated(unsafe) static var shared = WebStorage(file: WebStorage.defaultFile)

    /// Characters (UTF-16 units, as browsers count) allowed in total.
    static let quota = 5 * 1024 * 1024

    static var defaultFile: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let folder = base.appendingPathComponent(Bundle.main.bundleIdentifier ?? "SwiftJSX").appendingPathComponent("SwiftJSX")
        return folder.appendingPathComponent("localStorage.json")
    }

    private let file: URL
    private let lock = NSLock()
    private var items: [String: String]
    private var size: Int
    private var writeScheduled = false
    private let queue = DispatchQueue(label: "SwiftJSX.localStorage", qos: .utility)
    private var observers: [NSObjectProtocol] = []

    init(file: URL) {
        self.file = file
        var loaded = (try? Data(contentsOf: file)).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: String] }
        if loaded == nil, let old = UserDefaults(suiteName: "SwiftJSX.localStorage")?.dictionary(forKey: "items") as? [String: String] {
            loaded = old  // migrate from the UserDefaults store of earlier versions
        }
        items = loaded ?? [:]
        size = items.reduce(0) { $0 + $1.key.utf16.count + $1.value.utf16.count }
        #if canImport(UIKit)
        let background = [UIApplication.willResignActiveNotification, UIApplication.willTerminateNotification]
        #else
        let background = [NSApplication.willResignActiveNotification, NSApplication.willTerminateNotification]
        #endif
        observers = background.map { name in
            NotificationCenter.default.addObserver(forName: name, object: nil, queue: nil) { [weak self] _ in self?.flush() }
        }
    }

    deinit { observers.forEach(NotificationCenter.default.removeObserver) }

    func get(_ key: String) -> String? { lock.withLock { items[key] } }
    func keys() -> [String] { lock.withLock { items.keys.sorted() } }

    /// False (and no change) if it would exceed the quota.
    @discardableResult
    func set(_ key: String, _ value: String) -> Bool {
        let ok = lock.withLock {
            let old = items[key].map { key.utf16.count + $0.utf16.count } ?? 0
            let new = key.utf16.count + value.utf16.count
            guard size - old + new <= Self.quota else { return false }
            items[key] = value
            size += new - old
            return true
        }
        if ok { scheduleWrite() }
        return ok
    }

    func remove(_ key: String) {
        lock.withLock {
            if let old = items.removeValue(forKey: key) { size -= key.utf16.count + old.utf16.count }
        }
        scheduleWrite()
    }

    func clear() {
        lock.withLock {
            items = [:]
            size = 0
        }
        scheduleWrite()
    }

    private func scheduleWrite() {
        let schedule = lock.withLock {
            guard !writeScheduled else { return false }
            writeScheduled = true
            return true
        }
        if schedule { queue.asyncAfter(deadline: .now() + 0.2) { [weak self] in self?.write() } }
    }

    /// Write now (e.g. the app is going to the background).
    func flush() { queue.sync { write() } }

    private func write() {
        let snapshot = lock.withLock {
            writeScheduled = false
            return items
        }
        guard let data = try? JSONSerialization.data(withJSONObject: snapshot) else { return }
        try? FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? data.write(to: file, options: .atomic)
    }
}

/// URL parsing for the JS `URL` class: Foundation does the parsing and
/// relative resolution; the JS side keeps the WHATWG shape.
enum WebURL {
    static func parse(_ input: String, base: URL?) -> [String: String]? {
        // Like the WHATWG parser: leading and trailing spaces and controls go,
        // and tabs and newlines anywhere.
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines.union(.controlCharacters))
            .filter { $0 != "\t" && $0 != "\n" && $0 != "\r" }
        guard let url = URL(string: trimmed, relativeTo: base)?.absoluteURL,
              let scheme = url.scheme,
              var components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        else { return nil }
        let special = ["http", "https", "ws", "wss", "ftp", "file"].contains(scheme.lowercased())
        if special, components.path.isEmpty { components.path = "/" }
        if special { components.path = normalize(components.path) }
        var host = components.percentEncodedHost ?? ""
        if special, scheme.lowercased() != "file", !host.hasPrefix("[") {
            // Foundation percent-encodes what WHATWG rejects ("exa mple.com").
            // (IPv6 hosts, in brackets, are Foundation's to check.)
            guard let decoded = host.removingPercentEncoding, !decoded.isEmpty,
                  !decoded.contains(where: { forbiddenHost.contains($0) || $0.asciiValue.map { $0 < 0x20 || $0 == 0x7F } == true })
            else { return nil }
            if decoded.allSatisfy(\.isASCII) { host = decoded }
        }
        let defaultPorts = ["http": 80, "https": 443, "ws": 80, "wss": 443, "ftp": 21]
        let port = components.port.flatMap { defaultPorts[scheme.lowercased()] == $0 ? nil : String($0) } ?? ""
        let search = components.percentEncodedQuery.map { $0.isEmpty ? "" : "?" + $0 } ?? ""
        let hash = components.percentEncodedFragment.map { $0.isEmpty ? "" : "#" + $0 } ?? ""
        return [
            "protocol": scheme.lowercased() + ":",
            "username": components.percentEncodedUser ?? "",
            "password": components.percentEncodedPassword ?? "",
            "hostname": host.lowercased(),
            "port": port,
            "pathname": components.percentEncodedPath,
            "search": search,
            "hash": hash,
            "special": special ? "1" : "",
        ]
    }

    /// Code points a special URL's host can't have (WHATWG's forbidden
    /// domain code points, beyond controls).
    private static let forbiddenHost: Set<Character> = [" ", "#", "%", "/", ":", "<", ">", "?", "@", "[", "\\", "]", "^", "|"]

    /// Resolves "." and ".." segments, like the WHATWG parser.
    private static func normalize(_ path: String) -> String {
        var out: [Substring] = []
        let segments = path.split(separator: "/", omittingEmptySubsequences: false).dropFirst()
        for (index, segment) in segments.enumerated() {
            let last = index == segments.count - 1
            switch segment {
            case ".": if last { out.append("") }
            case "..": if !out.isEmpty { out.removeLast() }; if last { out.append("") }
            default: out.append(segment)
            }
        }
        return "/" + out.joined(separator: "/")
    }
}

private extension String {
    init?(validatingUTF8Data data: Data) {
        guard let string = String(data: data, encoding: .utf8) else { return nil }
        self = string
    }
}
