import Foundation
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

/// `fetch` goes to MockServer, and localStorage to a fresh, throwaway store.
func useMockServer() {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [MockServer.self]
    WebHost.session = URLSession(configuration: configuration)
    WebStorage.shared = WebStorage(suiteName: "SwiftJSXTests-\(UUID().uuidString)")
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
