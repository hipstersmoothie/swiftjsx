import Foundation

/// Counters for performance work (e.g. the iOS app's scroll benchmark).
/// Cheap enough to leave on; not meant for app logic.
@MainActor
public enum SwiftJSXDiagnostics {
    /// VirtualList slots currently on screen (by onAppear/onDisappear).
    static var visibleSlots = Set<Int>()
    /// VirtualList slots React has rendered content for.
    static var renderedSlots = Set<Int>()

    /// On-screen VirtualList slots still showing a placeholder.
    public static var blankVisibleRows: Int { visibleSlots.subtracting(renderedSlots).count }
    /// On-screen VirtualList slots.
    public static var visibleRows: Int { visibleSlots.count }
    /// VirtualList rows React has rendered (on screen or not).
    public internal(set) static var renderedRows = 0
    /// How many times a VirtualList's body was evaluated.
    public internal(set) static var virtualListBodies = 0
    /// Op batches (React commits) applied to the tree, and ops in them.
    public internal(set) static var commits = 0
    public internal(set) static var ops = 0
    /// Commits that ran inside a JS `withAnimation`.
    public internal(set) static var animatedCommits = 0

    static func countRenderedRows(in root: Node) {
        func find(_ node: Node) -> Node? {
            node.type == "VirtualList" ? node : node.children.lazy.compactMap(find).first
        }
        renderedRows = find(root)?.children.count ?? 0
    }

    public static func reset() {
        virtualListBodies = 0
        commits = 0
        ops = 0
    }
}
