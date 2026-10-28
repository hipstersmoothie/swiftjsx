import SwiftUI

// MARK: - Modifier props

/// Wraps a node in modifiers once it has modifier props, sheets to present, or
/// a ref (see `Node.decorated`). Undecorated nodes pass through untouched,
/// which matters for structural views: a `Section` wrapped in `.padding(0)`
/// would stop being a section as far as its `List` is concerned.
///
/// Everything below has a fixed structure: an unset prop gives a no-op
/// modifier, never a different branch, so toggling a prop doesn't change the
/// view's identity. (Modifiers that cost something even as a no-op are added
/// on first use instead; see `Node.features`.)
struct Decorations: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        if node.decorated {
            content
                .modifier(Modifiers(node: node))
                .background { Presenters(node: node) }
                .modifier(FrameTracker(node: node))
        } else {
            content
        }
    }
}

/// For nodes with a ref: records the laid-out frame for `ref.current.measure()`,
/// and gives the view an explicit `.id` so `scrollView.scrollTo(ref)` can find
/// it (ScrollViewReader doesn't find views by their ForEach identity in a
/// ScrollView).
struct FrameTracker: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        if node.features.contains(.ref) {
            content
                .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { node.setFrame($0) }
                .id(node.id)
        } else {
            content
        }
    }
}

/// Applies modifier props in a fixed, CSS-like order:
/// padding → frame → background → cornerRadius → border → shadow → opacity →
/// transforms (offset, scale, rotation) → gestures → accessibility.
struct Modifiers: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        content
            .transformEnvironment(\.font) { current in
                if let f = font(node.prop("font")) { current = f }
            }
            .fontWeight(node.string("fontWeight").flatMap(fontWeight))
            .fontDesign(node.string("fontDesign").flatMap(fontDesign))
            .modifier(ForegroundModifier(node: node))
            .padding(padding)
            .modifier(FrameModifier(frame: node.dict("frame")))
            // Sizing next to the frame, so backgrounds and corners follow it.
            .modifier(Sizing(node: node))
            // The background is drawn in the corner shape. Over a material,
            // only the content is clipped (before the background): a rounded
            // clip over a material turns off vibrancy, and hierarchical text
            // ("secondary") and dividers on it vanish.
            .clipShape(BoxShape(corners: hasMaterialBackground ? corners : Corners(nil), unbounded: true))
            .background {
                // Square backgrounds extend under the bars at screen edges
                // (full-bleed gradients), like SwiftUI's .background(style).
                BoxShape(corners: corners)
                    .fill(fill(node.prop("background")) ?? AnyShapeStyle(Color.clear))
                    .ignoresSafeArea(edges: corners.isSquare ? .all : [])
            }
            .clipShape(BoxShape(corners: hasMaterialBackground ? Corners(nil) : corners, unbounded: true))
            .overlay {
                if let border = node.dict("border") {
                    BoxShape(corners: Corners(node.prop("cornerRadius")))
                        .strokeBorder(fill(border["color"]) ?? AnyShapeStyle(.primary),
                                      lineWidth: (border["width"] as? NSNumber).map { CGFloat($0.doubleValue) } ?? 1)
                }
            }
            .modifier(ViewAttachments(node: node))
            .ignoresSafeArea(.all, edges: safeAreaEdges(node.prop("ignoresSafeArea")))
            .shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
            .opacity(node.bool("hidden") ? 0 : node.double("opacity") ?? 1)
            .fixedSize(horizontal: fixedSize.horizontal, vertical: fixedSize.vertical)
            .allowsHitTesting(!node.has("allowsHitTesting") || node.bool("allowsHitTesting"))
            .preferredColorScheme(colorScheme(node.string("preferredColorScheme")))
            .modifier(TintModifier(node: node))
            .zIndex(node.double("zIndex") ?? 0)
            .layoutPriority(node.double("layoutPriority") ?? 0)
            .layoutValue(key: AbsolutePosition.self, value: PositionSpec(node.prop("position")))
            .gridCellColumns(Int(node.double("gridColumns") ?? 1))
            .modifier(LayoutExtras(node: node))
            .disabled(node.bool("disabled"))
            .transition(transition(node.prop("transition")))
            .onAppear { if node.has("onAppear") { runtime?.dispatch(node.id, "onAppear") } }
            .onDisappear { if node.has("onDisappear") { runtime?.dispatch(node.id, "onDisappear") } }
            // Interactions (incl. double tap) inside the single tap, so a view
            // with both waits for the double tap before firing the single one.
            .modifier(Interactions(node: node))
            .modifier(TapModifier(node: node) { runtime?.fire(node, "onTapGesture", ["x": $0.x, "y": $0.y]) })
            .modifier(RefreshModifier(node: node))
            .modifier(AttachedActions(node: node))
            .modifier(Tag(value: node.string("tag")))
            .redacted(reason: node.bool("redacted") ? .placeholder : [])
            .modifier(DismissLock(node: node))
            // Environment only when set: a default here would override a parent's.
            .transformEnvironment(\.controlSize) { size in
                if let wanted = controlSize(node.string("controlSize")) { size = wanted }
            }
            .modifier(LabelStyleModifier(style: node.string("labelStyle")))
            .modifier(ZoomSource(id: node.string("transitionSource")))
            .modifier(DragAndDrop(node: node))
            .modifier(SystemOverlays(node: node))
            // Last, so the view's own background and border use it too.
            .transformEnvironment(\.colorScheme) { scheme in
                if let forced = colorScheme(node.string("colorScheme")) { scheme = forced }
            }
    }

    private var corners: Corners { Corners(node.prop("cornerRadius")) }

    /// `fixedSize`: true (both axes), "horizontal" or "vertical": take the
    /// ideal size instead of what's offered (no truncation).
    private var fixedSize: (horizontal: Bool, vertical: Bool) {
        switch node.prop("fixedSize") {
        case let b as Bool: (b, b)
        case let s as String: (s == "horizontal", s == "vertical")
        default: (false, false)
        }
    }

    private var hasMaterialBackground: Bool {
        (node.prop("background") as? String).flatMap(material) != nil
    }

    private var padding: EdgeInsets {
        switch node.prop("padding") {
        case let n as NSNumber where !(n === kCFBooleanTrue || n === kCFBooleanFalse):
            let v = CGFloat(n.doubleValue)
            return EdgeInsets(top: v, leading: v, bottom: v, trailing: v)
        case let b as Bool:
            return b ? EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16) : EdgeInsets()
        case let d as [String: Any]:
            func v(_ k: String) -> CGFloat? { (d[k] as? NSNumber).map { CGFloat($0.doubleValue) } }
            let h = v("horizontal") ?? 0, vert = v("vertical") ?? 0
            return EdgeInsets(top: v("top") ?? vert, leading: v("leading") ?? h, bottom: v("bottom") ?? vert, trailing: v("trailing") ?? h)
        default:
            return EdgeInsets()
        }
    }

    private var shadow: (color: Color, radius: CGFloat, x: CGFloat, y: CGFloat) {
        if let r = node.double("shadow") { return (.black.opacity(0.2), r, 0, r / 2) }
        if let d = node.dict("shadow") {
            func v(_ k: String) -> CGFloat { (d[k] as? NSNumber).map { CGFloat($0.doubleValue) } ?? 0 }
            return (color(d["color"]) ?? .black.opacity(0.2), v("radius"), v("x"), v("y"))
        }
        return (.clear, 0, 0, 0)
    }
}

/// Transforms, gestures beyond tap, and accessibility. Most decorated views use none of
/// them; skipping the whole group with one check keeps row creation in long
/// lists as cheap as before these existed.
struct Interactions: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        if node.features.isDisjoint(with: Node.interactionFeatures) {
            content
        } else {
            content
                .modifier(TransformModifier(node: node))
                .modifier(KeyframesModifier(node: node))
                .modifier(AppearModifier(node: node))
                .modifier(GestureModifiers(node: node))
                .modifier(AccessibilityModifier(node: node))
                .modifier(KeyPressModifier(node: node))
        }
    }
}

/// `<Overlay alignment>` and `<Background alignment>` children: views drawn
/// over or behind this one, sized to it (badges, decorations). Applied after
/// the background and corner clip, so overlays can stick out of rounded cards.
struct ViewAttachments: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        content
            .modifier(Layer(node: node, type: "Background", feature: .backgroundView, front: false))
            .modifier(Layer(node: node, type: "Overlay", feature: .overlay, front: true))
            .modifier(Inset(node: node))
    }

    /// `<SafeAreaInset edge="bottom">`: content docked to an edge of this
    /// view; the rest (scroll content) is inset so nothing hides behind it.
    /// For mini players and input bars.
    /// Once in use, all four edges are applied, each with its `<SafeAreaInset>`
    /// (or nothing): showing, hiding or moving an inset keeps the view's
    /// structure, so the NavigationStack or scroll view it's on keeps its state.
    private struct Inset: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            if node.features.contains(.safeAreaInset) {
                content
                    .safeAreaInset(edge: .bottom, spacing: spacing("bottom")) { inset("bottom") }
                    .safeAreaInset(edge: .top, spacing: spacing("top")) { inset("top") }
                    .safeAreaInset(edge: .leading, spacing: spacing("leading")) { inset("leading") }
                    .safeAreaInset(edge: .trailing, spacing: spacing("trailing")) { inset("trailing") }
            } else {
                content
            }
        }

        private func node(for edge: String) -> Node? {
            node.children.first { $0.type == "SafeAreaInset" && ($0.string("edge") ?? "bottom") == edge }
        }

        private func spacing(_ edge: String) -> CGFloat? {
            guard let inset = node(for: edge) else { return 0 }
            return inset.cgFloat("spacing")
        }

        @ViewBuilder private func inset(_ edge: String) -> some View {
            if let inset = node(for: edge) { LayerContent(node: inset) }
        }
    }

    private struct Layer: ViewModifier {
        let node: Node
        let type: String
        let feature: Node.Feature
        let front: Bool

        func body(content: Content) -> some View {
            if node.features.contains(feature) {
                // Each layer fills the view and aligns itself, so a corner
                // badge and a centered icon can share it.
                let layers = node.children.filter { $0.type == type }
                if front {
                    content.overlay { ForEach(layers) { AlignedLayer(node: $0) } }
                } else {
                    content.background { ForEach(layers) { AlignedLayer(node: $0) } }
                }
            } else {
                content
            }
        }
    }

    private struct AlignedLayer: View {
        let node: Node
        var body: some View {
            LayerContent(node: node)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: alignment(node.string("alignment")) ?? .center)
        }
    }

    private struct LayerContent: View {
        let node: Node
        var body: some View {
            ZStack(alignment: alignment(node.string("alignment")) ?? .center) { Children(node: node) }
                .modifier(Decorations(node: node))
        }
    }
}

/// `aspectRatio` and `relativeWidth` / `relativeHeight` (a fraction of the
/// nearest container: scroll view or screen). Each is attached on first use.
struct Sizing: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        content
            .modifier(Ratio(node: node))
            .modifier(Relative(node: node))
    }

    /// `aspectRatio`: a number (width / height, fits the space offered), or
    /// `{ ratio, contentMode: "fit" | "fill" }`.
    private struct Ratio: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            if node.features.contains(.aspectRatio) {
                let spec = node.prop("aspectRatio")
                let ratio = (spec as? NSNumber ?? (spec as? [String: Any])?["ratio"] as? NSNumber).map { CGFloat($0.doubleValue) }
                let fill = (spec as? [String: Any])?["contentMode"] as? String == "fill"
                content.aspectRatio(ratio, contentMode: fill ? .fill : .fit)
            } else {
                content
            }
        }
    }

    private struct Relative: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            if node.features.contains(.relativeFrame) {
                // Only the axes that are set: `relativeWidth` alone keeps the
                // view's own height.
                let width = node.cgFloat("relativeWidth"), height = node.cgFloat("relativeHeight")
                content.containerRelativeFrame(axes(width, height)) { length, axis in
                    length * ((axis == .horizontal ? width : height) ?? 1)
                }
            } else {
                content
            }
        }

        private func axes(_ width: CGFloat?, _ height: CGFloat?) -> Axis.Set {
            var axes: Axis.Set = []
            if width != nil { axes.insert(.horizontal) }
            if height != nil { axes.insert(.vertical) }
            return axes
        }
    }
}

/// `contentShape` ("rectangle" | "capsule" | "circle": the whole shape is
/// tappable), `onLayout({ width, height })` and list row props. Each is
/// attached on first use.
struct LayoutExtras: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        content
            .modifier(Shape(node: node))
            .modifier(Layout(node: node, runtime: runtime))
            .modifier(ListRow(node: node))
    }

    private struct Shape: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            if node.features.contains(.contentShape) {
                content.contentShape(shape(node.string("contentShape")))
            } else {
                content
            }
        }
        private func shape(_ name: String?) -> AnyShape {
            switch name {
            case "capsule": AnyShape(Capsule())
            case "circle": AnyShape(Circle())
            default: AnyShape(Rectangle())
            }
        }
    }

    private struct Layout: ViewModifier {
        let node: Node
        let runtime: JSXRuntime?
        func body(content: Content) -> some View {
            if node.features.contains(.layout) {
                content.onGeometryChange(for: CGSize.self) { $0.size } action: { size in
                    if node.has("onLayout") { runtime?.dispatch(node.id, "onLayout", ["width": size.width, "height": size.height]) }
                }
            } else {
                content
            }
        }
    }

    /// Row options inside a List: `listRowBackground`, `listRowInsets`,
    /// `listRowSeparator`, `badge`.
    private struct ListRow: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            if node.features.contains(.listRow) {
                content
                    .listRowBackground(fill(node.prop("listRowBackground")).map { Rectangle().fill($0) })
                    .listRowInsets(insets(node.prop("listRowInsets")))
                    .listRowSeparator(node.string("listRowSeparator") == "hidden" ? .hidden : .automatic)
                    .badge(badge(node.prop("badge")))
            } else {
                content
            }
        }
        private func badge(_ value: Any?) -> Text? {
            switch value {
            case let n as NSNumber where n.intValue != 0: Text("\(n.intValue)")
            case let s as String where !s.isEmpty: Text(s)
            default: nil
            }
        }
    }
}

/// Padding-style insets: a number, or `{ top, leading, bottom, trailing, horizontal, vertical }`.
func insets(_ value: Any?) -> EdgeInsets? {
    switch value {
    case let n as NSNumber:
        let v = CGFloat(n.doubleValue)
        return EdgeInsets(top: v, leading: v, bottom: v, trailing: v)
    case let d as [String: Any]:
        func v(_ k: String) -> CGFloat? { (d[k] as? NSNumber).map { CGFloat($0.doubleValue) } }
        let h = v("horizontal") ?? 0, vert = v("vertical") ?? 0
        return EdgeInsets(top: v("top") ?? vert, leading: v("leading") ?? h, bottom: v("bottom") ?? vert, trailing: v("trailing") ?? h)
    default:
        return nil
    }
}

/// `<SwipeActions edge>` and `<ContextMenu>` children: buttons shown when
/// the row is swiped (in a List) or long-pressed.
struct AttachedActions: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        content
            .modifier(Swipe(node: node))
            .modifier(Menu(node: node))
    }

    private struct Swipe: ViewModifier {
        let node: Node
        @Environment(\.inList) private var inList

        func body(content: Content) -> some View {
            #if os(iOS)
            if node.features.contains(.swipeActions), !inList {
                // Not a List row: SwiftUI's swipeActions do nothing there.
                SwipeRow(node: node) { content }
            } else {
                system(content)
            }
            #else
            system(content)
            #endif
        }

        @ViewBuilder private func system(_ content: Content) -> some View {
            if node.features.contains(.swipeActions) {
                let sets = node.children.filter { $0.type == "SwipeActions" }
                let leading = sets.first { $0.string("edge") == "leading" }
                let trailing = sets.first { $0.string("edge") != "leading" }
                content
                    .swipeActions(edge: .trailing, allowsFullSwipe: trailing?.bool("allowsFullSwipe") ?? false) {
                        if let trailing { Children(node: trailing) }
                    }
                    .swipeActions(edge: .leading, allowsFullSwipe: leading?.bool("allowsFullSwipe") ?? false) {
                        if let leading { Children(node: leading) }
                    }
            } else {
                content
            }
        }
    }

    private struct Menu: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            if node.features.contains(.contextMenu) {
                content.contextMenu {
                    if let menu = node.children.first(where: { $0.type == "ContextMenu" }) { Children(node: menu) }
                }
            } else {
                content
            }
        }
    }
}

/// `onRefresh`: pull to refresh on the scroll view or list inside. The
/// spinner stays until the handler's promise settles.
struct RefreshModifier: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        if node.features.contains(.refresh) {
            content.refreshable {
                if node.has("onRefresh") { await runtime?.dispatchAndWait(node.id, "onRefresh") }
            }
        } else {
            content
        }
    }
}

/// `foregroundStyle` (see `Node.features`). Once attached, an unset
/// prop falls back to the inherited style.
struct ForegroundModifier: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        if node.features.contains(.foreground) {
            content.foregroundStyle(fill(node.prop("foregroundStyle")) ?? AnyShapeStyle(.foreground))
        } else {
            content
        }
    }
}

/// `onTapGesture`. Once attached it stays; without a handler the gesture is
/// disabled (subviews' gestures keep working). The clear background makes the
/// whole frame tappable, like a div.
struct TapModifier: ViewModifier {
    let node: Node
    /// Called with where the tap landed, in the view's own coordinates.
    let action: (CGPoint) -> Void
    func body(content: Content) -> some View {
        if node.features.contains(.tap) {
            let enabled = node.has("onTapGesture")
            content
                .background { if enabled { Color.clear.contentShape(Rectangle()) } }
                .gesture(SpatialTapGesture().onEnded { action($0.location) }, including: enabled ? .all : .subviews)
        } else {
            content
        }
    }
}

struct FrameModifier: ViewModifier {
    let frame: [String: Any]?

    private func v(_ key: String) -> CGFloat? {
        if frame?[key] as? String == "infinity" { return .infinity }
        return (frame?[key] as? NSNumber).map { CGFloat($0.doubleValue) }
    }

    /// Both frames are always applied; with nil sizes each is a no-op.
    func body(content: Content) -> some View {
        let align = alignment(frame?["alignment"] as? String) ?? .center
        content.frame(width: v("width"), height: v("height"), alignment: align)
            .frame(minWidth: v("minWidth"), maxWidth: v("maxWidth"), minHeight: v("minHeight"), maxHeight: v("maxHeight"), alignment: align)
    }
}

/// `tag`: the row's value for List selection.
struct Tag: ViewModifier {
    let value: String?
    func body(content: Content) -> some View {
        if let value { content.tag(value) } else { content }
    }
}

/// `tint`, once used. Never forced to nil, so an unset tint inherits the
/// container's (`.tint(nil)` would reset it).
struct TintModifier: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        if node.features.contains(.tint), let tint = color(node.prop("tint")) {
            content.tint(tint)
        } else {
            content
        }
    }
}

struct ButtonStyleModifier: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        if PressableStyle.applies(to: node) {
            content.buttonStyle(PressableStyle(node: node, runtime: runtime))
        } else {
            switch node.string("buttonStyle") {
        case "bordered": content.buttonStyle(.bordered)
        case "borderedProminent": content.buttonStyle(.borderedProminent)
        case "borderless": content.buttonStyle(.borderless)
        case "plain": content.buttonStyle(.plain)
        default: content
        }
        }
    }
}

/// A Button with `pressedScale`, `pressedOpacity`, `pressedBackground` or
/// `onPressIn` / `onPressOut`: shows its content as is (like the plain
/// style) and applies those while the finger is down. Still a real button:
/// VoiceOver, scrolling cancels the press, the press fires on release.
struct PressableStyle: ButtonStyle {
    let node: Node
    let runtime: JSXRuntime?

    static func applies(to node: Node) -> Bool {
        ["pressedScale", "pressedOpacity", "pressedBackground", "onPressIn", "onPressOut"].contains(where: node.has)
    }

    func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed
        configuration.label
            .background { if pressed, let fill = fill(node.prop("pressedBackground")) { Rectangle().fill(fill) } }
            .scaleEffect(pressed ? node.cgFloat("pressedScale") ?? 1 : 1)
            .opacity(pressed ? node.double("pressedOpacity") ?? 1 : 1)
            .animation(.snappy(duration: 0.15), value: pressed)
            .onChange(of: pressed) { _, isPressed in
                let event = isPressed ? "onPressIn" : "onPressOut"
                if node.has(event) { runtime?.dispatch(node.id, event) }
            }
    }
}

struct PickerStyleModifier: ViewModifier {
    let style: String?
    func body(content: Content) -> some View {
        switch style {
        case "segmented": content.pickerStyle(.segmented)
        case "menu": content.pickerStyle(.menu)
        case "inline": content.pickerStyle(.inline)
        case "palette": content.pickerStyle(.palette)
        #if os(iOS)
        case "navigationLink": content.pickerStyle(.navigationLink)
        case "wheel": content.pickerStyle(.wheel)
        #endif
        default: content
        }
    }
}

// MARK: - Prop value parsing

func fontStyle(_ name: String) -> Font.TextStyle? {
    switch name {
    case "largeTitle": .largeTitle
    case "title": .title
    case "title2": .title2
    case "title3": .title3
    case "headline": .headline
    case "subheadline": .subheadline
    case "body": .body
    case "callout": .callout
    case "footnote": .footnote
    case "caption": .caption
    case "caption2": .caption2
    default: nil
    }
}

func fontWeight(_ name: String) -> Font.Weight? {
    switch name {
    case "ultraLight": .ultraLight
    case "thin": .thin
    case "light": .light
    case "regular": .regular
    case "medium": .medium
    case "semibold": .semibold
    case "bold": .bold
    case "heavy": .heavy
    case "black": .black
    default: nil
    }
}

func fontDesign(_ name: String) -> Font.Design? {
    switch name {
    case "rounded": .rounded
    case "monospaced": .monospaced
    case "serif": .serif
    case "default": .default
    default: nil
    }
}

func alignment(_ name: String?) -> Alignment? {
    switch name {
    case "leading": .leading
    case "trailing": .trailing
    case "top": .top
    case "bottom": .bottom
    case "center": .center
    case "topLeading": .topLeading
    case "topTrailing": .topTrailing
    case "bottomLeading": .bottomLeading
    case "bottomTrailing": .bottomTrailing
    default: nil
    }
}

func colorScheme(_ name: String?) -> ColorScheme? {
    switch name {
    case "light": .light
    case "dark": .dark
    default: nil
    }
}

func textAlignment(_ name: String?) -> TextAlignment {
    switch name {
    case "center": .center
    case "trailing": .trailing
    default: .leading
    }
}

func horizontalAlignment(_ name: String?) -> HorizontalAlignment {
    switch name {
    case "leading": .leading
    case "trailing": .trailing
    default: .center
    }
}

func verticalAlignment(_ name: String?) -> VerticalAlignment {
    switch name {
    case "top": .top
    case "bottom": .bottom
    case "firstTextBaseline": .firstTextBaseline
    default: .center
    }
}

func parseImageScale(_ name: String?) -> Image.Scale {
    switch name {
    case "small": .small
    case "large": .large
    default: .medium
    }
}

func buttonRole(_ name: String?) -> ButtonRole? {
    switch name {
    case "destructive": .destructive
    case "cancel": .cancel
    default: nil
    }
}

/// `transition`: a name, or `{ type, edge, scale, anchor, x, y, animation }`,
/// or `{ insert, remove }` (each a name or an object) for different ways in
/// and out. `animation` is the transition's own (a new tile pops in with a
/// bouncy spring while its parent's changes use another curve).
func transition(_ spec: Any?) -> AnyTransition {
    if let spec = spec as? [String: Any] {
        if spec["insert"] != nil || spec["remove"] != nil {
            return .asymmetric(insertion: transition(spec["insert"]), removal: transition(spec["remove"]))
        }
        let base = namedTransition(spec["type"] as? String, spec)
        return parseAnimation(spec["animation"]).map { base.animation($0) } ?? base
    }
    return namedTransition(spec as? String, [:])
}

private func namedTransition(_ name: String?, _ options: [String: Any]) -> AnyTransition {
    let edge = (options["edge"] as? String).flatMap(edge)
    func number(_ key: String) -> CGFloat? { (options[key] as? NSNumber).map { CGFloat($0.doubleValue) } }
    switch name {
    case "scale":
        return .scale(scale: number("scale") ?? 0, anchor: unitPoint(options["anchor"] as? String) ?? .center).combined(with: .opacity)
    case "slide": return .slide
    case "move": return .move(edge: edge ?? .bottom).combined(with: .opacity)
    case "push": return .push(from: edge ?? .trailing)
    case "offset": return .offset(x: number("x") ?? 0, y: number("y") ?? 0).combined(with: .opacity)
    case "blur": return AnyTransition(.blurReplace)
    case "identity": return .identity
    default: return .opacity
    }
}

private func edge(_ name: String) -> Edge? {
    switch name {
    case "top": .top
    case "bottom": .bottom
    case "leading": .leading
    case "trailing": .trailing
    default: nil
    }
}

func controlSize(_ name: String?) -> ControlSize? {
    switch name {
    case "mini": .mini
    case "small": .small
    case "regular": .regular
    case "large": .large
    case "extraLarge": .extraLarge
    default: nil
    }
}

/// `labelStyle`: "iconOnly", "titleOnly", "titleAndIcon" for the Labels
/// inside (buttons, menus, toolbars).
struct LabelStyleModifier: ViewModifier {
    let style: String?
    func body(content: Content) -> some View {
        switch style {
        case "iconOnly": content.labelStyle(.iconOnly)
        case "titleOnly": content.labelStyle(.titleOnly)
        case "titleAndIcon": content.labelStyle(.titleAndIcon)
        default: content
        }
    }
}

/// `statusBarHidden` and `persistentSystemOverlays` ("hidden": the home
/// indicator fades while watching full-screen media) on a screen.
struct SystemOverlays: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        content
            #if os(iOS)
            .modifier(Optional(node.has("statusBarHidden") ? node.bool("statusBarHidden") : nil) { $0.statusBarHidden($1) })
            #endif
            .modifier(Optional(node.string("persistentSystemOverlays")) { view, value in
                view.persistentSystemOverlays(value == "hidden" ? .hidden : value == "visible" ? .visible : .automatic)
            })
    }

    /// Applies `transform` when `value` is non-nil.
    private struct Optional<Value>: ViewModifier {
        let value: Value?
        let transform: (Content, Value) -> AnyView
        init<V: View>(_ value: Value?, _ transform: @escaping (Content, Value) -> V) {
            self.value = value
            self.transform = { AnyView(transform($0, $1)) }
        }
        func body(content: Content) -> some View {
            if let value { transform(content, value) } else { content }
        }
    }
}

/// Drag and drop between any views (and other apps): `draggable="payload"`
/// makes a view draggable with that string; `onDrop(items, location)` makes
/// one a target, `onDropTargetChange(over)` says when something hovers.
struct DragAndDrop: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        content
            .modifier(Source(payload: node.string("draggable")))
            .modifier(Target(node: node, runtime: runtime))
    }

    private struct Source: ViewModifier {
        let payload: String?
        func body(content: Content) -> some View {
            if let payload { content.draggable(payload) } else { content }
        }
    }

    private struct Target: ViewModifier {
        let node: Node
        let runtime: JSXRuntime?
        func body(content: Content) -> some View {
            if node.has("onDrop") {
                content.dropDestination(for: String.self) { items, location in
                    runtime?.dispatch(node.id, "onDrop", ["items": items, "location": ["x": location.x, "y": location.y]])
                    return true
                } isTargeted: { over in
                    if node.has("onDropTargetChange") { runtime?.dispatch(node.id, "onDropTargetChange", over) }
                }
            } else {
                content
            }
        }
    }
}

/// `interactiveDismissDisabled` on any view inside a sheet: the sheet can't be
/// swiped away while it's true (a form with unsaved changes, a game board).
struct DismissLock: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        if node.has("interactiveDismissDisabled") {
            content.interactiveDismissDisabled(node.bool("interactiveDismissDisabled"))
        } else {
            content
        }
    }
}

/// `ignoresSafeArea`: true (every edge), an edge ("top", "bottom",
/// "horizontal", "vertical", "leading", "trailing"), or a list of them.
func safeAreaEdges(_ value: Any?) -> Edge.Set {
    if let all = value as? Bool { return all ? .all : [] }
    let names = (value as? [String]) ?? (value as? String).map { [$0] } ?? []
    return names.reduce(into: Edge.Set()) { edges, name in
        switch name {
        case "top": edges.insert(.top)
        case "bottom": edges.insert(.bottom)
        case "leading": edges.insert(.leading)
        case "trailing": edges.insert(.trailing)
        case "horizontal": edges.formUnion(.horizontal)
        case "vertical": edges.formUnion(.vertical)
        case "all": edges.formUnion(.all)
        default: break
        }
    }
}
