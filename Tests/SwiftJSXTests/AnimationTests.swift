import Foundation
import Testing
@testable import SwiftJSX

/// The worklet animation engine: animations stepped on the main thread every
/// frame, derived values, reactions and canvases (Tests/Fixtures/Animations.tsx).
@MainActor
@Suite(.serialized) struct AnimationEngineTests {
    func setUp() async throws -> (JSXRuntime, Node) {
        let runtime = try fixture("Animations", threading: .background)
        #expect(await eventually { runtime.find("VStack") { $0.string("accessibilityIdentifier") == "box" } != nil })
        let box = try #require(runtime.find("VStack") { $0.string("accessibilityIdentifier") == "box" })
        return (runtime, box)
    }

    func x(_ node: Node) -> Double { ((node.dict("offset") ?? [:])["x"] as? NSNumber)?.doubleValue ?? .nan }
    func y(_ node: Node) -> Double { ((node.dict("offset") ?? [:])["y"] as? NSNumber)?.doubleValue ?? .nan }
    func log(_ runtime: JSXRuntime) -> String? { runtime.texts().first { $0.hasPrefix("log ") } }

    @Test func timingStepsEveryFrameAndCallsBack() async throws {
        let (runtime, box) = try await setUp()
        runtime.press("timing")
        // Mid-animation values are visible (linear over 0.4 s).
        #expect(await eventually { x(box) > 5 && x(box) < 95 })
        // The derived value follows every frame.
        #expect(y(box) == x(box) * 2)
        #expect(await eventually { x(box) == 100 })
        #expect(await eventually { log(runtime) == "log timing true" })
        // The reaction saw it cross 50.
        #expect(await eventually { runtime.texts().contains("over true") })
        #expect(runtime.error == nil)
    }

    @Test func sequencesRepeatsAndDelays() async throws {
        let (runtime, box) = try await setUp()
        runtime.press("sequence")
        #expect(await eventually { x(box) > 40 })
        #expect(await eventually { x(box) == 10 })

        // Four rounds, reversing: back where it started.
        runtime.press("repeat")
        #expect(await eventually { x(box) > 15 })
        #expect(await eventually { log(runtime) == "log repeat true" })
        #expect(x(box) == 10)

        runtime.press("delay")
        try await Task.sleep(for: .milliseconds(100))
        #expect(x(box) == 10, "still waiting out the delay")
        #expect(await eventually { x(box) == 40 })
    }

    @Test func decayCoastsToAStop() async throws {
        let (runtime, box) = try await setUp()
        runtime.press("decay")
        #expect(await eventually { log(runtime) == "log decay true" })
        // 1000 pt/s at 0.998 per ms coasts about 500 points.
        #expect(abs(x(box) - 500) < 10)
    }

    @Test func springsStartAtTheGivenVelocity() async throws {
        let (runtime, box) = try await setUp()
        runtime.press("spring")
        // Flung the other way first: it goes negative before settling at 0.
        #expect(await eventually { x(box) < -20 })
        #expect(await eventually { log(runtime) == "log spring true" })
        #expect(x(box) == 0)
    }

    @Test func physicalSpringsOvershoot() async throws {
        let (runtime, box) = try await setUp()
        runtime.press("physical")
        // Lightly damped (ζ ≈ 0.23): past 50 before it settles there.
        #expect(await eventually { x(box) > 55 })
        #expect(await eventually { log(runtime) == "log physical true" })
        #expect(x(box) == 50)
    }

    @Test func interruptedAnimationsReportUnfinished() async throws {
        let (runtime, box) = try await setUp()
        runtime.press("interrupt")
        #expect(await eventually { log(runtime) == "log interrupted true" })
        #expect(await eventually { x(box) == 5 })

        runtime.press("cancel")
        #expect(await eventually { x(box) > 5 })
        try await Task.sleep(for: .milliseconds(400))
        let stopped = x(box)
        #expect(stopped > 5 && stopped < 300)
        try await Task.sleep(for: .milliseconds(200))
        #expect(x(box) == stopped, "cancelAnimation stops it where it is")
    }

    @Test func canvasShadowsBlendModesTextAndImages() async throws {
        let (runtime, _) = try await setUp()
        let canvas = try #require(runtime.find("Canvas") { $0.string("accessibilityIdentifier") == "fx-canvas" })
        let commands = runtime.worklets.draw(canvas, size: CGSize(width: 100, height: 100), time: 0).compactMap { $0 as? [Any] }
        let fill = try #require(commands.first)
        let fx = try #require(fill.last as? [String: Any])
        #expect(fx["blend"] as? String == "multiply")
        #expect((fx["shadow"] as? [Any])?.count == 4)
        // measureText measured "Hello" (about 30 points at 12pt).
        let text = try #require(commands.first { $0.first as? String == "text" })
        let width = Int((text[1] as? String ?? "").dropFirst()) ?? 0
        #expect(width > 20 && width < 45)
        #expect(commands.contains { $0.first as? String == "image" && $0[1] as? String == "https://example.invalid/a.png" })
        #expect(commands.contains { $0.first as? String == "symbol" && $0[1] as? String == "star.fill" })
    }

    @Test func canvasesRecordCommandsAndRedrawOnChanges() async throws {
        let (runtime, _) = try await setUp()
        let canvas = try #require(runtime.find("Canvas"))
        let commands = runtime.worklets.draw(canvas, size: CGSize(width: 200, height: 10), time: 0)
        let fill = try #require(commands.first as? [Any])
        #expect(fill.first as? String == "fill")
        #expect((fill[1] as? [Any])?.compactMap { ($0 as? NSNumber)?.doubleValue } == [0, 0, 0, 10])
        let text = try #require(commands.last as? [Any])
        #expect(text.first as? String == "text" && text[1] as? String == "hi")
        #expect((text[6] as? NSNumber)?.doubleValue == 12 && text[7] as? String == "bold")

        // The shared value it read changes: it's asked to draw again.
        let version = canvas.canvasVersion
        runtime.press("timing")
        #expect(await eventually { canvas.canvasVersion > version + 2 })
        let later = runtime.worklets.draw(canvas, size: CGSize(width: 200, height: 10), time: 0)
        let width = ((later.first as? [Any])?[1] as? [Any])?[3] as? NSNumber
        #expect((width?.doubleValue ?? 0) > 0)
    }
}
