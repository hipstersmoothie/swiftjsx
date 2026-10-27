import Foundation
import SwiftUI
import Testing
@testable import SwiftJSX

@MainActor
struct NavigationTests {
    let runtime: JSXRuntime
    init() throws { runtime = try fixture("Navigation") }

    var stack: Node? { runtime.find("NavigationStack") }

    @Test func pushAndPopKeepPerScreenState() throws {
        #expect(runtime.error == nil)
        #expect(stack?.children.count == 1)

        runtime.press("push")
        runtime.press("push")
        #expect(stack?.children.count == 3)
        #expect(runtime.texts().contains("depth 2"))

        runtime.press("like 1")
        runtime.press("like 2")
        runtime.press("like 2")
        #expect(runtime.texts().contains("likes 1: 1"))
        #expect(runtime.texts().contains("likes 2: 2"))

        // User swipes back once: SwiftUI reports a path of length 1.
        let stack = try #require(stack)
        runtime.dispatch(stack.id, "onPathChange", 1)
        #expect(stack.children.count == 2)
        #expect(runtime.texts().contains("depth 1"))
        #expect(runtime.texts().contains("likes 1: 1"))
        #expect(!runtime.texts().contains("likes 2: 2"))
    }

    @Test func screenTitles() {
        runtime.press("push")
        let titles = runtime.findAll("Screen").compactMap { $0.string("title") }
        #expect(titles == ["Home", "Detail 1"])
    }

    @Test func sheetsAndAlertsAreDeclarative() throws {
        let sheet = try #require(runtime.find("Sheet"))
        #expect(sheet.isPresentation)
        #expect(!sheet.bool("isPresented"))

        runtime.press("open sheet")
        #expect(sheet.bool("isPresented"))
        runtime.dispatch(sheet.id, "onDismiss")
        #expect(!sheet.bool("isPresented"))

        let alert = try #require(runtime.find("Alert"))
        runtime.press("open alert")
        #expect(alert.bool("isPresented"))
        #expect(alert.string("title") == "Sure?")
        runtime.dispatch(alert.id, "onDismiss")
        #expect(!alert.bool("isPresented"))
    }
}

@MainActor
struct VirtualListTests {
    let runtime: JSXRuntime
    init() throws { runtime = try fixture("VirtualList") }

    var list: Node? { runtime.find("VirtualList") }
    var renderedIndices: [Int] { (list?.children ?? []).compactMap { $0.double("index").map(Int.init) } }

    @Test func onlyRendersAWindow() throws {
        #expect(list?.double("count") == 100_000)
        #expect(renderedIndices == Array(0..<40))
    }

    @Test func followsTheVisibleRange() throws {
        let list = try #require(list)
        // Scrolling down: `overscan` (10) behind, two screens (2 × 13) ahead.
        runtime.dispatch(list.id, "onRangeChange", ["first": 5000, "last": 5012])
        #expect(renderedIndices == Array(4990...5038))
        #expect(runtime.texts().contains("row 5000"))
        #expect(!runtime.texts().contains("row 0"))

        // Small scrolls inside the lead don't re-render.
        runtime.dispatch(list.id, "onRangeChange", ["first": 5001, "last": 5013])
        #expect(renderedIndices.first == 4990)

        // Scrolling up: the lead flips to the top.
        runtime.dispatch(list.id, "onRangeChange", ["first": 4000, "last": 4012])
        #expect(renderedIndices == Array(3974...4022))
    }

    @Test func scrollToIndex() throws {
        runtime.press("jump")
        #expect(list?.scrollRequest?.target == AnyHashable(500))
    }
}

@MainActor
struct RefTests {
    let runtime: JSXRuntime
    init() throws { runtime = try fixture("Refs") }

    @Test func focusFromEffectAndBlur() async throws {
        let field = try #require(runtime.find("TextField"))
        #expect(await eventually { field.focusRequest.focused })
        runtime.press("blur")
        #expect(!field.focusRequest.focused)
        #expect(field.focusRequest.seq == 2)
    }

    @Test func scrollToNodeAndEdge() throws {
        let scroller = try #require(runtime.find("ScrollView"))
        let box = try #require(runtime.find("Text") { $0.textContent == "box" })
        runtime.press("scroll to box")
        #expect(scroller.scrollRequest?.target == AnyHashable(box.id))
        #expect(scroller.scrollRequest?.animated == true)

        runtime.press("scroll to end")
        #expect(scroller.scrollRequest?.target == AnyHashable(ScrollEdge.end))
        #expect(scroller.scrollRequest?.animated == false)
        #expect(scroller.scrollRequest?.anchor == .bottom)
    }

    @Test func measureResolvesAPromise() async throws {
        let box = try #require(runtime.find("Text") { $0.textContent == "box" })
        #expect(box.has("__ref"))
        #expect(runtime.find("Button")?.has("__ref") == false)
        box.frame = CGRect(x: 10, y: 20, width: 120, height: 44)
        runtime.press("measure")
        #expect(await eventually { runtime.texts().contains("measured 120x44") })
    }
}

/// `Refresh.edit1.tsx` / `Refresh.edit2.tsx` are edits of `Refresh.tsx`, built
/// through the real pipeline (React Compiler + react-refresh) and registered
/// under the same module id, as if the file had been saved.
@MainActor
struct FastRefreshTests {
    @Test func editsKeepStateAndHookChangesRemount() async throws {
        let runtime = try fixture("Refresh")
        runtime.press("inc")
        runtime.press("inc")
        #expect(runtime.texts().contains("Count: 2"))

        // Edit the JSX. The compiler had cached that <Text> (count didn't
        // change), so this also checks a hot update doesn't serve stale JSX.
        runtime.hotUpdate(app: try fixtureSource("Refresh.edit1"))
        #expect(runtime.texts().contains("Clicks: 2"))
        #expect(runtime.error == nil)

        // Handlers are the new code too.
        runtime.press("inc")
        #expect(runtime.texts().contains("Clicks: 3"))

        // Change a hook's initializer: the hook signature changes, so React
        // Refresh remounts instead of reusing incompatible state.
        runtime.hotUpdate(app: try fixtureSource("Refresh.edit2"))
        #expect(runtime.texts().contains("Clicks: 10"))
    }

    @Test func syntaxErrorsShowARedBoxAndRecover() throws {
        let runtime = try fixture("Refresh")
        runtime.press("inc")

        runtime.hotUpdate(app: "this is not javascript (")
        #expect(runtime.error != nil)
        #expect(runtime.texts().contains("Count: 1"))

        runtime.hotUpdate(app: try fixtureSource("Refresh.edit1"))
        #expect(runtime.error == nil)
        #expect(runtime.texts().contains("Clicks: 1"))
    }
}

/// The fixture has no memo/useMemo/useCallback; the React Compiler adds them.
@MainActor
struct CompilerTests {
    @Test func unchangedChildrenDoNotRerender() throws {
        let runtime = try fixture("Compiler")
        for _ in 0..<5 { runtime.press("inc") }
        #expect(runtime.texts().contains("count 5"))

        runtime.press("report")
        // Mounted once; the parent's 5 re-renders reused the cached element.
        #expect(runtime.texts().contains("expensive renders 1"))
    }

    @Test func bundlesAreCompiled() throws {
        #expect(try fixtureSource("Compiler").contains("import_compiler_runtime.c)("))
        let runtime = try #require(JSXRuntime.runtimeScript("runtime"))
        #expect(runtime.contains("import_compiler_runtime.c)("))
    }

    @Test func productionBundlesUseTheProductionRuntime() async throws {
        let runtime = try fixture("Hooks.production")
        #expect(runtime.isProduction)
        #expect(runtime.error == nil)
        #expect(runtime.texts().contains("Hello!"))
        runtime.press("+")
        runtime.press("+")
        #expect(runtime.texts().contains("2"))

        let dev = try #require(JSXRuntime.runtimeScript("runtime"))
        let prod = try #require(JSXRuntime.runtimeScript("runtime.production"))
        #expect(prod.count < dev.count / 2)
        #expect(!prod.contains("react-refresh"))
    }
}

@MainActor
@Suite(.serialized) struct AnimationTests {
    @Test func withAnimationTagsOnlyItsOwnCommit() async throws {
        let runtime = try fixture("Animation")
        let before = SwiftJSXDiagnostics.animatedCommits
        runtime.press("Animated")
        // flushSync: the commit has already happened when the handler returns.
        #expect(runtime.texts().contains("open"))
        #expect(SwiftJSXDiagnostics.animatedCommits == before + 1)
        runtime.press("Plain")
        #expect(runtime.texts().contains("count 1"))
        #expect(SwiftJSXDiagnostics.animatedCommits == before + 1)
    }

    @Test func parsesAnimationSpecs() {
        #expect(parseAnimation("spring") != nil)
        #expect(parseAnimation(["type": "easeInOut", "duration": 0.6, "delay": 0.1]) != nil)
        #expect(parseAnimation(nil) == nil)
        #expect(parseAnimation(42) == nil)
    }
}

@MainActor
@Suite struct WorkletTests {
    private func offset(_ node: Node) -> [Double] {
        let o = node.dict("offset") ?? [:]
        return [(o["x"] as? NSNumber)?.doubleValue ?? .nan, (o["y"] as? NSNumber)?.doubleValue ?? .nan]
    }

    private func drag(_ x: Double, _ y: Double) -> [String: Any] {
        ["translation": ["x": x, "y": y], "location": ["x": 0, "y": 0], "startLocation": ["x": 0, "y": 0],
         "velocity": ["x": 0, "y": 0], "predictedEndTranslation": ["x": x, "y": y]]
    }

    @Test func gestureWorkletsUpdateStylesSynchronously() async throws {
        // JS on its own thread, as in the app: nothing below waits for it
        // except the runOnJS / sync-back checks.
        let runtime = try fixture("Worklets", threading: .background)
        #expect(await eventually { runtime.find("VStack") { $0.string("accessibilityIdentifier") == "card" } != nil })
        let card = try #require(runtime.find("VStack") { $0.string("accessibilityIdentifier") == "card" })
        #expect(offset(card) == [0, 0])
        #expect(card.features.contains(.transform))

        // Runs on the main thread inside the "touch event": updated on return.
        runtime.fire(card, "onDrag", drag(150, 80))
        #expect(offset(card) == [100, 80])  // clamped by the captured LIMIT
        #expect(card.double("opacity") == 0.5)
        #expect(runtime.error == nil)

        // Worklet → JS thread → React, and the value synced back for JS reads.
        runtime.press("Read")
        #expect(await eventually { runtime.texts().contains("read 100,80") })

        // The first drag event lifts with a spring while the offset follows
        // the finger unanimated: two steps.
        #expect(runtime.worklets.lastSteps == ["spring", "none"])
        #expect(card.double("scale") == 1.1)

        runtime.fire(card, "onDragEnd", drag(150, 80))
        #expect(offset(card) == [0, 0])
        #expect(card.double("opacity") == 1)
        // A spring and a timing curve in one handler each keep their own.
        #expect(runtime.worklets.lastSteps.sorted() == ["easeInOut", "spring"])
        #expect(await eventually { runtime.texts().contains("drops 1") })
        // runOnJS callbacks run after the values sync, so they see the drop.
        #expect(runtime.texts().contains("dropped at 0,0"))
    }

    @Test func jsThreadWritesReachTheMainThread() async throws {
        let runtime = try fixture("Worklets", threading: .background)
        #expect(await eventually { runtime.find("VStack") { $0.string("accessibilityIdentifier") == "card" } != nil })
        let card = try #require(runtime.find("VStack") { $0.string("accessibilityIdentifier") == "card" })
        runtime.press("Set from JS")
        #expect(await eventually { offset(card) == [5, 5] })
    }
}
