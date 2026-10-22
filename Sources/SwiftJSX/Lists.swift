import SwiftUI

/// `<ScrollView>` with `ref.current.scrollTo(…)` support.
struct ScrollViewHost: View {
    let node: Node

    var body: some View {
        let horizontal = node.string("axis") == "horizontal"
        ScrollViewReader { proxy in
            ScrollView(horizontal ? .horizontal : .vertical) {
                Group {
                    if horizontal { HStack { Children(node: node) } } else { VStack { Children(node: node) } }
                }
                .background(alignment: horizontal ? .leading : .top) {
                    Color.clear.frame(width: 1, height: 1).id(ScrollEdge.top)
                }
                .background(alignment: horizontal ? .trailing : .bottom) {
                    Color.clear.frame(width: 1, height: 1).id(ScrollEdge.end)
                }
            }
            .onChange(of: node.scrollRequest) { _, request in scroll(proxy, request) }
        }
    }
}

/// `<VirtualList>`: lays out `count` lazy slots, renders React's rows for the
/// ones it has, placeholders for the rest, and tells React which slots are on
/// screen so it can render just those.
///
/// The list body only depends on `count` and style props, never on the rows:
/// rebuilding a ForEach over 100k slots on every React commit stalled the main
/// thread for ~1 s per commit on an iPhone 15 Pro Max. Each slot looks up its
/// own row instead, so a commit only re-evaluates the slots on screen.
struct VirtualListHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var visible = VisibleRange()

    var body: some View {
        let count = max(0, Int(node.double("count") ?? 0))
        let layout = SlotLayout(fixed: node.cgFloat("itemHeight"), estimated: node.cgFloat("estimatedItemHeight") ?? 44)
        SwiftJSXDiagnostics.virtualListBodies += 1

        return ScrollViewReader { proxy in
            Group {
                // Default: a LazyVStack. SwiftUI's List looks a row up by walking
                // its ForEach from the start, so cells get slower the further
                // down you are (unusable after jumping to row 50,000 of 100k).
                if node.string("listStyle") != "list" {
                    ScrollView {
                        LazyVStack(spacing: node.cgFloat("spacing")) { slots(count: count, layout: layout) }
                    }
                } else if let fixed = layout.fixed {
                    // Rows exactly as tall as the list estimates, so self-sizing
                    // never disagrees with the estimate (see VirtualSlot).
                    List { slots(count: count, layout: layout) }
                        .environment(\.defaultMinListRowHeight, fixed)
                } else {
                    List { slots(count: count, layout: layout) }
                }
            }
            .onChange(of: node.scrollRequest) { _, request in scroll(proxy, request) }
        }
    }

    private func slots(count: Int, layout: SlotLayout) -> some View {
        ForEach(0..<count, id: \.self) { index in
            VirtualSlot(list: node, index: index, layout: layout)
                .onAppear { visible.update(inserting: index, report: report) }
                .onDisappear { visible.update(removing: index, report: report) }
        }
    }

    private func report(_ first: Int, _ last: Int) {
        runtime?.dispatch(node.id, "onRangeChange", ["first": first, "last": last])
    }
}

struct SlotLayout: Equatable {
    /// `itemHeight`: every row is exactly this tall (fastest; no jumps when a
    /// placeholder becomes a row).
    var fixed: CGFloat?
    /// `estimatedItemHeight`: placeholder height for self-sizing rows.
    var estimated: CGFloat
}

/// One slot: React's row for `index` if it has rendered one, else a placeholder.
/// Reading `list.children` here (not in the list body) scopes Observation
/// invalidation to on-screen slots.
struct VirtualSlot: View {
    let list: Node
    let index: Int
    let layout: SlotLayout

    var body: some View {
        let row = list.children.first { Int($0.double("index") ?? -1) == index }
        // A ZStack, not a Group: List treats a Group's contents as its own rows,
        // so swapping placeholder ⇄ row inside a Group changed the *list's*
        // structure and made SwiftUI re-walk all `count` slots (~1 s per update
        // at 100k on an iPhone). A ZStack is one opaque row.
        ZStack(alignment: .leading) {
            if let row {
                VStack(alignment: .leading, spacing: 0) { Children(node: row) }
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Color.clear
            }
        }
        .frame(height: layout.fixed ?? (row == nil ? layout.estimated : nil))
        .listRowInsets(layout.fixed == nil ? nil : EdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 20))
        .onAppear { if row != nil { SwiftJSXDiagnostics.renderedSlots.insert(index) } }
        .onChange(of: row == nil) { _, missing in
            if missing { SwiftJSXDiagnostics.renderedSlots.remove(index) } else { SwiftJSXDiagnostics.renderedSlots.insert(index) }
        }
        .onDisappear { SwiftJSXDiagnostics.renderedSlots.remove(index) }
    }
}

/// Tracks on-screen slots and reports the range at most once per runloop turn.
@MainActor
final class VisibleRange {
    private var indices = Set<Int>()
    private var scheduled = false
    private var lastReported: (Int, Int)?

    func update(inserting index: Int, report: @escaping (Int, Int) -> Void) {
        indices.insert(index)
        SwiftJSXDiagnostics.visibleSlots.insert(index)
        schedule(report)
    }

    func update(removing index: Int, report: @escaping (Int, Int) -> Void) {
        indices.remove(index)
        SwiftJSXDiagnostics.visibleSlots.remove(index)
        schedule(report)
    }

    private func schedule(_ report: @escaping (Int, Int) -> Void) {
        guard !scheduled else { return }
        scheduled = true
        DispatchQueue.main.async { [self] in
            MainActor.assumeIsolated {
                scheduled = false
                guard let first = indices.min(), let last = indices.max() else { return }
                if let (f, l) = lastReported, f == first, l == last { return }
                lastReported = (first, last)
                report(first, last)
            }
        }
    }
}

@MainActor
private func scroll(_ proxy: ScrollViewProxy, _ request: ScrollRequest?) {
    guard let request else { return }
    // Pass the concrete ID type: a List only matches ids of its ForEach's ID
    // type (Int), not the same value wrapped in AnyHashable.
    let go = {
        if let id = request.target.base as? Int {
            proxy.scrollTo(id, anchor: request.anchor)
        } else if let edge = request.target.base as? ScrollEdge {
            proxy.scrollTo(edge, anchor: request.anchor)
        } else {
            proxy.scrollTo(request.target, anchor: request.anchor)
        }
    }
    if request.animated { withAnimation(.default, go) } else { go() }
}
