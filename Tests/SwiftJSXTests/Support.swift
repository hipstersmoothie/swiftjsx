import Foundation
import Testing
@testable import SwiftJSX

/// Fixtures are `Tests/Fixtures/*.tsx`, built by `npm run build` into `build/tests/`.
@MainActor
func fixture(_ name: String, threading: JSThreading = .main) throws -> JSXRuntime {
    let runtime = JSXRuntime(threading: threading)
    runtime.load(app: try fixtureSource(name))
    return runtime
}

func fixtureSource(_ name: String) throws -> String {
    let url = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("build/tests/\(name).js")
    return try String(contentsOf: url, encoding: .utf8)
}

/// Polls `condition` while letting the main queue run (JS commits, timers).
/// The timeout is generous: shared CI runners are slow and a passing check
/// returns as soon as it holds.
@MainActor
func eventually(timeout: Duration = .seconds(15), _ condition: () -> Bool) async -> Bool {
    let deadline = ContinuousClock.now + timeout
    while !condition() {
        if ContinuousClock.now > deadline { return false }
        try? await Task.sleep(for: .milliseconds(10))
    }
    return true
}

@MainActor
extension JSXRuntime {
    func all(_ node: Node? = nil) -> [Node] {
        let node = node ?? tree.root
        return [node] + node.children.flatMap { all($0) }
    }

    func find(_ type: String, where match: (Node) -> Bool = { _ in true }) -> Node? {
        all().first { $0.type == type && match($0) }
    }

    func findAll(_ type: String) -> [Node] {
        all().filter { $0.type == type }
    }

    func texts() -> [String] {
        findAll("Text").map(\.textContent)
    }

    func button(_ title: String) -> Node? {
        find("Button") { $0.string("title") == title }
    }

    func press(_ title: String) {
        guard let button = button(title) else { return }
        dispatch(button.id, "onPress")
    }
}

/// Runs a fixture built with Tests/Fixtures/support/checks.tsx and records
/// each failing check (and checks that never finished) as a test issue.
@MainActor
func expectChecksPass(_ name: String, timeout: Duration = .seconds(10), sourceLocation: SourceLocation = #_sourceLocation) async throws {
    let runtime = try fixture(name, threading: .background)
    let done = await eventually(timeout: timeout) {
        guard let summary = runtime.texts().first, let total = summary.split(separator: " ").last else { return false }
        return summary.hasPrefix("\(total) of")
    }
    for failure in runtime.texts().dropFirst() where failure.hasPrefix("FAIL") {
        Issue.record("\(failure)", sourceLocation: sourceLocation)
    }
    #expect(done, "only \(runtime.texts().first ?? "?") checks finished: \(runtime.texts().dropFirst())", sourceLocation: sourceLocation)
    #expect(runtime.error == nil, "\(runtime.error ?? "")", sourceLocation: sourceLocation)
}
