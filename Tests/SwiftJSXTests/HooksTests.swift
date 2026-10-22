import Foundation
import Testing
@testable import SwiftJSX

/// Hooks fixture, with JS on the main thread so every event re-renders
/// synchronously.
@MainActor
struct HooksTests {
    let runtime: JSXRuntime

    init() throws {
        runtime = try fixture("Hooks")
    }

    @Test func mountsWithoutErrors() {
        #expect(runtime.error == nil)
        #expect(runtime.texts().contains("Hello!"))
        #expect(runtime.texts().contains("useReducer · 1 left"))
    }

    @Test func controlledTextFieldUpdatesSynchronously() throws {
        let field = try #require(runtime.find("TextField") { $0.string("placeholder") == "Your name" })
        runtime.dispatch(field.id, "onChange", "Ada")
        #expect(field.string("value") == "Ada")
        #expect(runtime.texts().contains("Hello, Ada!"))
    }

    @Test func buttonsAndUseState() {
        runtime.press("+")
        runtime.press("+")
        #expect(runtime.texts().contains("2"))
    }

    @Test func useReducerAddsAndRemovesRows() throws {
        let draft = try #require(runtime.find("TextField") { $0.string("placeholder") == "New todo…" })
        runtime.dispatch(draft.id, "onChange", "Ship it")
        runtime.press("Add")
        #expect(runtime.texts().contains("Ship it"))
        #expect(runtime.texts().contains("useReducer · 2 left"))
        #expect(draft.string("value") == "")

        let trash = try #require(runtime.find("Image") { $0.string("systemName") == "trash" }?.parent)
        runtime.dispatch(trash.id, "onPress")
        #expect(!runtime.texts().contains("Write a React renderer"))
    }

    @Test func useEffectIntervalTicks() async throws {
        let toggle = try #require(runtime.find("Toggle"))
        runtime.dispatch(toggle.id, "onChange", true)
        #expect(toggle.bool("value"))
        #expect(await eventually { toggle.string("label") == "Timer: 2s" })
        runtime.dispatch(toggle.id, "onChange", false)
    }
}

/// Same fixture with JS on its background queue (the default).
@MainActor
struct BackgroundThreadTests {
    @Test func rendersAndHandlesEventsOffMain() async throws {
        let runtime = try fixture("Hooks", threading: .background)
        #expect(await eventually { runtime.texts().contains("Hello!") })
        runtime.press("+")
        runtime.press("+")
        runtime.press("+")
        #expect(await eventually { runtime.texts().contains("3") })
        #expect(runtime.error == nil)
    }

    @Test func controlledInputsAcknowledgeTheirLatestEvent() async throws {
        let runtime = try fixture("Hooks", threading: .background)
        #expect(await eventually { runtime.find("TextField") != nil })
        let field = try #require(runtime.find("TextField") { $0.string("placeholder") == "Your name" })

        // Two quick keystrokes, as Controlled would send them.
        for (seq, text) in ["A", "Ad", "Ada"].enumerated() {
            field.sentSeq = seq + 1
            runtime.dispatch(field.id, "onChange", text, seq: seq + 1)
        }
        #expect(await eventually { field.ackSeq == 3 })
        #expect(field.string("value") == "Ada")
        #expect(runtime.texts().contains("Hello, Ada!"))
    }
}
