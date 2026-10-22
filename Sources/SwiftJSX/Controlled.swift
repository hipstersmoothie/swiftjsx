import SwiftUI

/// Two-way binding for a controlled input (`value` + `onChange`), with React
/// as the source of truth.
///
/// With JS on a background thread, React's answer to a keystroke arrives a
/// moment later. Meanwhile the control shows its own local value, and each
/// edit is tagged with a sequence number. Props that were rendered before JS
/// saw our latest edit are stale echoes and are ignored; once JS catches up,
/// the control goes back to showing exactly what React rendered (so input
/// masking, clearing on submit, etc. all work). Same idea as React Native's
/// `mostRecentEventCount`.
struct Controlled<Value: Equatable, Content: View>: View {
    let node: Node
    let fallback: Value
    var read: (Any?) -> Value? = { $0 as? Value }
    @ViewBuilder let content: (Binding<Value>) -> Content

    @Environment(\.jsxRuntime) private var runtime
    @State private var local: Value?

    var body: some View {
        let prop = read(node.props["value"]) ?? fallback
        content(Binding(
            get: { local ?? prop },
            set: { newValue in
                guard newValue != (local ?? prop) else { return }
                local = newValue
                node.sentSeq += 1
                runtime?.dispatch(node.id, "onChange", newValue, seq: node.sentSeq)
            }
        ))
        .onChange(of: node.ackSeq) { catchUp() }
        .onChange(of: prop) { catchUp() }
    }

    private func catchUp() {
        if node.ackSeq >= node.sentSeq { local = nil }
    }
}
