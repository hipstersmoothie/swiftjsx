import Foundation
import Network
import Testing
@testable import SwiftJSX

/// Serves https://mock.test/… for `fetch` tests.
final class MockServer: URLProtocol {
    override class func canInit(with request: URLRequest) -> Bool { request.url?.host == "mock.test" }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let url = request.url!
        func respond(_ status: Int, _ headers: [String: String], _ body: Data) {
            let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: body)
            client?.urlProtocolDidFinishLoading(self)
        }
        func json(_ object: [String: Any]) -> Data { try! JSONSerialization.data(withJSONObject: object) }

        switch url.path {
        case "/json":
            respond(200, ["Content-Type": "application/json", "X-Test": "yes"], json(["hello": "world", "query": url.query ?? ""]))
        case "/echo":
            let body = request.httpBody ?? request.httpBodyStream.map(Self.read) ?? Data()
            respond(200, ["Content-Type": "application/json"], json([
                "method": request.httpMethod ?? "",
                "contentType": request.value(forHTTPHeaderField: "Content-Type") ?? "",
                "custom": request.value(forHTTPHeaderField: "X-Custom") ?? "",
                "body": String(decoding: body, as: UTF8.self),
            ]))
        case "/slow":
            DispatchQueue.global().asyncAfter(deadline: .now() + 5) { [weak self] in
                guard let self, !self.stopped else { return }
                respond(200, [:], Data())
            }
        case "/wsport":
            respond(200, [:], Data(String(EchoServer.shared.port).utf8))
        case "/fail":
            client?.urlProtocol(self, didFailWithError: URLError(.cannotConnectToHost))
        default:
            let status = Int(url.lastPathComponent) ?? 404
            respond(status, [:], Data("status \(status)".utf8))
        }
    }

    private var stopped = false
    override func stopLoading() { stopped = true }

    private static func read(_ stream: InputStream) -> Data {
        stream.open()
        defer { stream.close() }
        var data = Data()
        var buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let count = stream.read(&buffer, maxLength: buffer.count)
            if count <= 0 { break }
            data.append(buffer, count: count)
        }
        return data
    }
}

/// A WebSocket echo server on localhost (sends every message back as is).
final class EchoServer: @unchecked Sendable {
    static let shared = EchoServer()
    private(set) var port: UInt16 = 0
    private let listener: NWListener

    init() {
        let parameters = NWParameters.tcp
        parameters.defaultProtocolStack.applicationProtocols.insert(NWProtocolWebSocket.Options(), at: 0)
        listener = try! NWListener(using: parameters, on: .any)
        let ready = DispatchSemaphore(value: 0)
        listener.stateUpdateHandler = { state in if case .ready = state { ready.signal() } }
        listener.newConnectionHandler = { connection in
            connection.start(queue: .global())
            Self.echo(connection)
        }
        listener.start(queue: .global())
        ready.wait()
        port = listener.port?.rawValue ?? 0
    }

    private static func echo(_ connection: NWConnection) {
        connection.receiveMessage { data, context, _, error in
            guard error == nil, let context else { return }
            let metadata = context.protocolMetadata(definition: NWProtocolWebSocket.definition) as? NWProtocolWebSocket.Metadata
            if metadata?.opcode == .close {
                connection.send(content: nil, contentContext: context, isComplete: true, completion: .contentProcessed { _ in connection.cancel() })
                return
            }
            let reply = NWConnection.ContentContext(identifier: "echo", metadata: [NWProtocolWebSocket.Metadata(opcode: metadata?.opcode ?? .text)])
            connection.send(content: data, contentContext: reply, isComplete: true, completion: .contentProcessed { _ in echo(connection) })
        }
    }
}

/// `fetch` goes to MockServer, and localStorage to a fresh, throwaway store.
func useMockServer() {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [MockServer.self]
    WebHost.session = URLSession(configuration: configuration)
    WebStorage.shared = WebStorage(file: FileManager.default.temporaryDirectory.appendingPathComponent("SwiftJSXTests-\(UUID().uuidString).json"))
}

@MainActor
@Suite(.serialized) struct WebAPITests {
    @Test func webAPIsWork() async throws {
        useMockServer()

        try await expectChecksPass("WebAPIs")
    }

    @Test func npmPackagesWork() async throws {
        useMockServer()
        try await expectChecksPass("Packages")
    }
}

@Suite struct StorageTests {
    @Test func persistsToItsFileAndEnforcesTheQuota() throws {
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("storage-\(UUID().uuidString).json")
        let storage = WebStorage(file: file)
        #expect(storage.set("name", "Ada"))
        storage.set("count", "1")
        storage.remove("count")
        storage.flush()
        let reloaded = WebStorage(file: file)
        #expect(reloaded.get("name") == "Ada")
        #expect(reloaded.get("count") == nil)
        // Over the quota: refused, nothing changes.
        #expect(!reloaded.set("big", String(repeating: "x", count: WebStorage.quota)))
        #expect(reloaded.get("big") == nil)
        try? FileManager.default.removeItem(at: file)
    }
}
