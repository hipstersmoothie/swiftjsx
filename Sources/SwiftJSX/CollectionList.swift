#if os(iOS)
import SwiftUI
import UIKit

/// `<VirtualList listStyle="list">` on iOS: an inset-grouped UICollectionView
/// list whose cells host the same `VirtualSlot` SwiftUI views as the stack
/// style (via `UIHostingConfiguration`). It looks like a SwiftUI `List`, but
/// cells are found by index, so it's as fast at row 50,000 as at row 0.
struct CollectionList: UIViewRepresentable {
    let node: Node
    let count: Int
    let layout: SlotLayout
    let runtime: JSXRuntime?

    func makeCoordinator() -> Coordinator { Coordinator() }

    /// Fills behind the bars, which the list itself stays clear of.
    static func background(_ node: Node) -> Color {
        Color(uiColor: appearance(node) == .plain ? .systemBackground : .systemGroupedBackground)
    }

    func makeUIView(context: Context) -> UICollectionView {
        let appearance = Self.appearance(node)
        var configuration = UICollectionLayoutListConfiguration(appearance: appearance)
        configuration.backgroundColor = .clear
        // A row's <SwipeActions> as UIKit swipe actions.
        let coordinator = context.coordinator
        configuration.trailingSwipeActionsConfigurationProvider = { [weak coordinator] in coordinator?.swipeActions(at: $0, leading: false) }
        configuration.leadingSwipeActionsConfigurationProvider = { [weak coordinator] in coordinator?.swipeActions(at: $0, leading: true) }
        let layout = UICollectionViewCompositionalLayout { _, environment in
            let section = NSCollectionLayoutSection.list(using: configuration, layoutEnvironment: environment)
            // UIKit's default top padding for a grouped section is about twice
            // SwiftUI List's; match List.
            if appearance != .plain { section.contentInsets.top = 16 }
            return section
        }
        let view = TrackedCollectionView(frame: .zero, collectionViewLayout: layout)
        view.backgroundColor = .clear
        // SwiftUI already lays the list out inside the safe area; registering it
        // as the content scroll view would make UIKit inset it a second time.
        view.contentInsetAdjustmentBehavior = .never
        view.allowsSelection = false
        view.selfSizingInvalidation = .enabledIncludingConstraints
        view.register(UICollectionViewListCell.self, forCellWithReuseIdentifier: "row")
        view.dataSource = context.coordinator
        view.delegate = context.coordinator
        context.coordinator.update(self)
        return view
    }

    func updateUIView(_ view: UICollectionView, context: Context) {
        let coordinator = context.coordinator
        let countChanged = coordinator.count != count
        let layoutChanged = coordinator.layout != layout
        coordinator.update(self)
        if countChanged || layoutChanged { view.reloadData() }
        // Pull to refresh: `onRefresh` on the list (or an ancestor) sets the
        // environment's refresh action, as it would for a SwiftUI List.
        coordinator.refresh = context.environment.refresh
        if coordinator.refresh != nil, view.refreshControl == nil {
            let control = UIRefreshControl()
            control.addAction(UIAction { [weak coordinator, weak control] _ in
                Task { @MainActor in
                    await coordinator?.refresh?()
                    control?.endRefreshing()
                }
            }, for: .valueChanged)
            view.refreshControl = control
        } else if coordinator.refresh == nil {
            view.refreshControl = nil
        }
        if let request = node.scrollRequest, request.seq != coordinator.lastScroll {
            coordinator.lastScroll = request.seq
            coordinator.scroll(view, request)
        }
    }

    private static func appearance(_ node: Node) -> UICollectionLayoutListConfiguration.Appearance {
        switch node.string("listAppearance") {
        case "plain": .plain
        case "grouped": .grouped
        default: .insetGrouped
        }
    }

    /// Registers itself as its screen's content scroll view, so the navigation
    /// bar collapses its large title and updates its background as it scrolls,
    /// like it does for a SwiftUI List.
    final class TrackedCollectionView: UICollectionView {
        override func didMoveToWindow() {
            super.didMoveToWindow()
            guard window != nil else { return }
            // The page the navigation controller shows, not the nearest
            // (SwiftUI-internal) view controller.
            var responder: UIResponder? = self
            var page: UIViewController?
            while let next = responder?.next {
                if let controller = next as? UIViewController {
                    page = controller
                    if controller.parent is UINavigationController { break }
                }
                responder = next
            }
            page?.setContentScrollView(self, for: .top)
        }
    }

    @MainActor
    final class Coordinator: NSObject, UICollectionViewDataSource, UICollectionViewDelegate {
        var count = 0
        var layout = SlotLayout(fixed: nil, estimated: 44)
        var lastScroll = 0
        var refresh: RefreshAction?
        private var node: Node?
        private var runtime: JSXRuntime?
        private let visible = VisibleRange()

        func update(_ list: CollectionList) {
            node = list.node
            runtime = list.runtime
            count = list.count
            layout = list.layout
        }

        func collectionView(_ view: UICollectionView, numberOfItemsInSection section: Int) -> Int { count }

        /// The row's `<SwipeActions edge>` (in its element, or one level in).
        func swipeActions(at indexPath: IndexPath, leading: Bool) -> UISwipeActionsConfiguration? {
            guard let node, let row = node.children.first(where: { Int($0.double("index") ?? -1) == indexPath.item }) else { return nil }
            func find(_ parent: Node, depth: Int) -> Node? {
                if let set = parent.children.first(where: { $0.type == "SwipeActions" && ($0.string("edge") == "leading") == leading }) { return set }
                guard depth > 0 else { return nil }
                return parent.children.lazy.compactMap { find($0, depth: depth - 1) }.first
            }
            guard let set = find(row, depth: 2) else { return nil }
            let actions = set.children.filter { $0.type == "Button" }.map { button -> UIContextualAction in
                let label = button.children.first { $0.type == "Label" }
                let destructive = button.string("role") == "destructive"
                let action = UIContextualAction(style: destructive ? .destructive : .normal,
                                                title: button.string("title") ?? label?.string("title")) { [weak self] _, _, done in
                    if button.has("onPress") { self?.runtime?.fire(button, "onPress") }
                    done(true)
                }
                if let tint = color(button.prop("tint")) {
                    action.backgroundColor = UIColor(tint)
                } else if !destructive {
                    action.backgroundColor = .systemGray
                }
                if let icon = button.string("systemImage") ?? label?.string("systemImage") { action.image = UIImage(systemName: icon) }
                return action
            }
            guard !actions.isEmpty else { return nil }
            let configuration = UISwipeActionsConfiguration(actions: actions)
            configuration.performsFirstActionWithFullSwipe = set.bool("allowsFullSwipe")
            return configuration
        }

        func collectionView(_ view: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
            let cell = view.dequeueReusableCell(withReuseIdentifier: "row", for: indexPath)
            guard let node else { return cell }
            let configuration = UIHostingConfiguration {
                VirtualSlot(list: node, index: indexPath.item, layout: layout)
                    .environment(\.jsxRuntime, runtime)
                    // Swipe actions come from UIKit here (below), not SwipeRow.
                    .environment(\.inList, true)
            }
            // Fixed heights are exact: no vertical cell margins on top.
            cell.contentConfiguration = layout.fixed == nil ? configuration : configuration.margins(.vertical, 0)
            return cell
        }

        func collectionView(_ view: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
            visible.update(inserting: indexPath.item, report: report)
        }

        func collectionView(_ view: UICollectionView, didEndDisplaying cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
            visible.update(removing: indexPath.item, report: report)
        }

        private func report(_ first: Int, _ last: Int) {
            guard let node else { return }
            runtime?.dispatch(node.id, "onRangeChange", ["first": first, "last": last])
        }

        func scroll(_ view: UICollectionView, _ request: ScrollRequest) {
            let item: Int
            switch request.target.base {
            case let index as Int: item = index
            case let edge as ScrollEdge: item = edge == .top ? 0 : count - 1
            case let offset as ScrollOffset:
                return view.setContentOffset(CGPoint(x: offset.x ?? view.contentOffset.x, y: offset.y ?? view.contentOffset.y), animated: request.animated)
            default: return
            }
            guard count > 0 else { return }
            let position: UICollectionView.ScrollPosition = switch request.anchor {
            case .center?: .centeredVertically
            case .bottom?: .bottom
            default: .top
            }
            view.scrollToItem(at: IndexPath(item: min(max(item, 0), count - 1), section: 0), at: position, animated: request.animated)
        }
    }
}
#endif
