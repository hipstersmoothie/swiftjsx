import SwiftUI

// MARK: - Modifier props

/// Wraps a node in modifiers once it has modifier props, sheets to present, or
/// a ref (see `Node.decorated`). Undecorated nodes pass through untouched,
/// which matters for structural views: a `Section` wrapped in `.padding(0)`
/// would stop being a section as far as its `List` is concerned.
///
/// Everything below has a fixed structure: an unset prop gives a no-op
/// modifier, never a different branch, so toggling a prop doesn't change the
/// view's identity.
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

/// Records the laid-out frame of nodes with a ref, for `ref.current.measure()`,
/// and gives the view an explicit `.id` so `scrollView.scrollTo(ref)` can find
/// it (ScrollViewReader doesn't find views by their ForEach identity in a
/// ScrollView). The geometry reader is a background, so attaching a ref doesn't
/// change the view's identity, and nodes without one don't pay for it on every
/// scroll frame.
struct FrameTracker: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        content
            .background {
                if node.has("__ref") {
                    Color.clear.onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { node.frame = $0 }
                }
            }
            .id(node.id)
    }
}

/// Applies modifier props in a fixed, CSS-like order:
/// padding → frame → background → cornerRadius → border → shadow → opacity.
struct Modifiers: ViewModifier {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        content
            .transformEnvironment(\.font) { font in
                if let f = node.string("font").flatMap(fontStyle) { font = .system(f) }
            }
            .fontWeight(node.string("fontWeight").flatMap(fontWeight))
            .fontDesign(node.string("fontDesign").flatMap(fontDesign))
            .modifier(ForegroundModifier(node: node))
            .padding(padding)
            .modifier(FrameModifier(frame: node.dict("frame")))
            .background(node.string("background").flatMap(color) ?? .clear)
            .clipShape(CornerClip(radius: node.cgFloat("cornerRadius") ?? 0))
            .overlay {
                if let border = node.dict("border") {
                    RoundedRectangle(cornerRadius: node.cgFloat("cornerRadius") ?? 0)
                        .stroke(color(border["color"] as? String ?? "") ?? .primary,
                                lineWidth: (border["width"] as? NSNumber).map { CGFloat($0.doubleValue) } ?? 1)
                }
            }
            .shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
            .opacity(node.bool("hidden") ? 0 : node.double("opacity") ?? 1)
            .disabled(node.bool("disabled"))
            .transition(transition(node.string("transition")))
            .onAppear { if node.has("onAppear") { runtime?.dispatch(node.id, "onAppear") } }
            .modifier(TapModifier(enabled: node.has("onTapGesture")) { runtime?.dispatch(node.id, "onTapGesture") })
    }

    private var padding: EdgeInsets {
        switch node.props["padding"] {
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
            return ((d["color"] as? String).flatMap(color) ?? .black.opacity(0.2), v("radius"), v("x"), v("y"))
        }
        return (.clear, 0, 0, 0)
    }
}

/// `foregroundStyle` (see `Node.hasForegroundStyle`). Once attached, an unset
/// prop falls back to the inherited style.
struct ForegroundModifier: ViewModifier {
    let node: Node
    func body(content: Content) -> some View {
        if node.hasForegroundStyle {
            content.foregroundStyle(node.string("foregroundStyle").flatMap(color).map(AnyShapeStyle.init) ?? AnyShapeStyle(.foreground))
        } else {
            content
        }
    }
}

/// `cornerRadius` clip. Without a radius it clips nothing, so children's
/// shadows and overflow still show.
struct CornerClip: Shape {
    var radius: CGFloat
    var animatableData: CGFloat {
        get { radius }
        set { radius = newValue }
    }

    func path(in rect: CGRect) -> Path {
        radius > 0 ? Path(roundedRect: rect, cornerRadius: radius, style: .continuous)
            : Path(rect.insetBy(dx: -1e6, dy: -1e6))
    }
}

/// `onTapGesture`. Always attached (disabled while the prop is unset, which
/// keeps subviews' gestures working) so adding a handler keeps the view's
/// identity. The clear background makes the whole frame tappable, like a div.
struct TapModifier: ViewModifier {
    let enabled: Bool
    let action: () -> Void
    func body(content: Content) -> some View {
        content
            .background { if enabled { Color.clear.contentShape(Rectangle()) } }
            .gesture(TapGesture().onEnded(action), including: enabled ? .all : .subviews)
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

struct ButtonStyleModifier: ViewModifier {
    let style: String?
    func body(content: Content) -> some View {
        switch style {
        case "bordered": content.buttonStyle(.bordered)
        case "borderedProminent": content.buttonStyle(.borderedProminent)
        case "borderless": content.buttonStyle(.borderless)
        case "plain": content.buttonStyle(.plain)
        default: content
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
        default: content
        }
    }
}

// MARK: - Prop value parsing

func color(_ name: String) -> Color? {
    switch name {
    case "primary": .primary
    case "secondary": .secondary
    case "accent": .accentColor
    case "red": .red
    case "orange": .orange
    case "yellow": .yellow
    case "green": .green
    case "mint": .mint
    case "teal": .teal
    case "cyan": .cyan
    case "blue": .blue
    case "indigo": .indigo
    case "purple": .purple
    case "pink": .pink
    case "brown": .brown
    case "gray": .gray
    case "black": .black
    case "white": .white
    case "clear": .clear
    default: hexColor(name)
    }
}

/// `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` — same as CSS.
func hexColor(_ string: String) -> Color? {
    guard string.hasPrefix("#") else { return nil }
    var hex = String(string.dropFirst())
    if hex.count == 3 || hex.count == 4 { hex = hex.map { "\($0)\($0)" }.joined() }
    if hex.count == 6 { hex += "ff" }
    guard hex.count == 8, let v = UInt64(hex, radix: 16) else { return nil }
    return Color(.sRGB,
                 red: Double((v >> 24) & 0xff) / 255,
                 green: Double((v >> 16) & 0xff) / 255,
                 blue: Double((v >> 8) & 0xff) / 255,
                 opacity: Double(v & 0xff) / 255)
}

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

func transition(_ name: String?) -> AnyTransition {
    switch name {
    case "scale": .scale.combined(with: .opacity)
    case "slide": .slide
    case "move": .move(edge: .bottom).combined(with: .opacity)
    default: .opacity
    }
}
