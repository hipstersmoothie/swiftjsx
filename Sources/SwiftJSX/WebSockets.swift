import Foundation
import JavaScriptCore

/// Native half of the JS `WebSocket` (js/web/websocket.ts), on
/// URLSessionWebSocketTask. Events go to `__swiftjsx_wsEvent(id, type, payload)`
/// on the JS thread.
final class WebSocketHub: NSObject, URLSessionWebSocketDelegate, @unchecked Sendable {
    weak var engine: JSEngine?
    private let lock = NSLock()
    private var tasks: [Int: URLSessionWebSocketTask] = [:]
    private var ids: [Int: Int] = [:]  // task identifier → JS id
    private var closed = Set<Int>()
    private lazy var session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)

    func open(_ id: Int, url: URL, protocols: [String]) {
        let task = session.webSocketTask(with: url, protocols: protocols)
        lock.withLock {
            tasks[id] = task
            ids[task.taskIdentifier] = id
        }
        receive(task, id)
        task.resume()
    }

    func send(_ id: Int, _ message: URLSessionWebSocketTask.Message) {
        lock.withLock { tasks[id] }?.send(message) { [weak self] error in
            if let error { self?.fail(id, error) }
        }
    }

    func close(_ id: Int, code: Int, reason: String) {
        let closeCode = URLSessionWebSocketTask.CloseCode(rawValue: code) ?? .normalClosure
        lock.withLock { tasks[id] }?.cancel(with: closeCode, reason: Data(reason.utf8))
    }

    private func receive(_ task: URLSessionWebSocketTask, _ id: Int) {
        task.receive { [weak self, weak task] result in
            guard let self, let task else { return }
            switch result {
            case .success(.string(let text)):
                self.emit(id, "message", text)
            case .success(.data(let data)):
                self.emit(id, "message", data)
            case .success:
                break
            case .failure:
                return  // the delegate reports the close or error
            }
            self.receive(task, id)
        }
    }

    // MARK: URLSessionWebSocketDelegate

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        guard let id = lock.withLock({ ids[webSocketTask.taskIdentifier] }) else { return }
        emit(id, "open", `protocol` ?? "")
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask,
                    didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        guard let id = lock.withLock({ ids[webSocketTask.taskIdentifier] }) else { return }
        finish(id, code: closeCode.rawValue, reason: reason.map { String(decoding: $0, as: UTF8.self) } ?? "", clean: true)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let id = lock.withLock({ ids[task.taskIdentifier] }) else { return }
        if let error { fail(id, error) } else { finish(id, code: 1005, reason: "", clean: true) }
    }

    private func fail(_ id: Int, _ error: Error) {
        guard !lock.withLock({ closed.contains(id) }) else { return }
        emit(id, "error", error.localizedDescription)
        finish(id, code: 1006, reason: "", clean: false)
    }

    private func finish(_ id: Int, code: Int, reason: String, clean: Bool) {
        let first = lock.withLock {
            guard closed.insert(id).inserted else { return false }
            if let task = tasks.removeValue(forKey: id) { ids[task.taskIdentifier] = nil }
            return true
        }
        if first { emit(id, "close", ["code": code, "reason": reason, "wasClean": clean]) }
    }

    private func emit(_ id: Int, _ type: String, _ payload: Any) {
        let payload = UncheckedSendable(payload)
        engine?.perform { ctx in
            let value: Any = (payload.value as? Data).map { JSEngine.arrayBuffer($0, in: ctx) } ?? payload.value
            ctx.objectForKeyedSubscript("__swiftjsx_wsEvent")?.call(withArguments: [id, type, value])
        }
    }
}
