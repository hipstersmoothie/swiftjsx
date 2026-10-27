import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

// Colors, fills, fonts, shapes and styled text: the values JS props carry.

// MARK: - Colors

/// A color prop: a name ("blue", "systemBackground"…), hex ("#rrggbb[aa]"),
/// either with "/NN" for NN% opacity ("blue/20"), or `{ light, dark }`.
func color(_ value: Any?) -> Color? {
    switch value {
    case let string as String:
        return color(string)
    case let pair as [String: Any]:
        guard let light = color(pair["light"]), let dark = color(pair["dark"]) else { return nil }
        return adaptive(light: light, dark: dark)
    default:
        return nil
    }
}

func color(_ name: String) -> Color? {
    // "blue/20": 20% opacity.
    if let slash = name.lastIndex(of: "/"), let percent = Double(name[name.index(after: slash)...]) {
        return color(String(name[..<slash]))?.opacity(percent / 100)
    }
    switch name {
    case "primary": return .primary
    case "secondary": return .secondary
    case "accent": return .accentColor
    case "red": return .red
    case "orange": return .orange
    case "yellow": return .yellow
    case "green": return .green
    case "mint": return .mint
    case "teal": return .teal
    case "cyan": return .cyan
    case "blue": return .blue
    case "indigo": return .indigo
    case "purple": return .purple
    case "pink": return .pink
    case "brown": return .brown
    case "gray": return .gray
    case "black": return .black
    case "white": return .white
    case "clear": return .clear
    default: return systemColor(name) ?? hexColor(name)
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

/// iOS's semantic colors, which adapt to light and dark mode.
private func systemColor(_ name: String) -> Color? {
    #if canImport(UIKit)
    let colors: [String: UIColor] = [
        "systemBackground": .systemBackground,
        "secondarySystemBackground": .secondarySystemBackground,
        "tertiarySystemBackground": .tertiarySystemBackground,
        "systemGroupedBackground": .systemGroupedBackground,
        "secondarySystemGroupedBackground": .secondarySystemGroupedBackground,
        "tertiarySystemGroupedBackground": .tertiarySystemGroupedBackground,
        "systemFill": .systemFill,
        "secondarySystemFill": .secondarySystemFill,
        "tertiarySystemFill": .tertiarySystemFill,
        "quaternarySystemFill": .quaternarySystemFill,
        "label": .label,
        "secondaryLabel": .secondaryLabel,
        "tertiaryLabel": .tertiaryLabel,
        "quaternaryLabel": .quaternaryLabel,
        "placeholderText": .placeholderText,
        "separator": .separator,
        "opaqueSeparator": .opaqueSeparator,
        "link": .link,
        "systemGray": .systemGray,
        "systemGray2": .systemGray2,
        "systemGray3": .systemGray3,
        "systemGray4": .systemGray4,
        "systemGray5": .systemGray5,
        "systemGray6": .systemGray6,
    ]
    return colors[name].map { Color(uiColor: $0) }
    #else
    let colors: [String: NSColor] = [
        "systemBackground": .windowBackgroundColor,
        "secondarySystemBackground": .controlBackgroundColor,
        "tertiarySystemBackground": .textBackgroundColor,
        "systemGroupedBackground": .windowBackgroundColor,
        "secondarySystemGroupedBackground": .controlBackgroundColor,
        "tertiarySystemGroupedBackground": .textBackgroundColor,
        "systemFill": .systemFill,
        "secondarySystemFill": .secondarySystemFill,
        "tertiarySystemFill": .tertiarySystemFill,
        "quaternarySystemFill": .quaternarySystemFill,
        "label": .labelColor,
        "secondaryLabel": .secondaryLabelColor,
        "tertiaryLabel": .tertiaryLabelColor,
        "quaternaryLabel": .quaternaryLabelColor,
        "placeholderText": .placeholderTextColor,
        "separator": .separatorColor,
        "opaqueSeparator": .gridColor,
        "link": .linkColor,
        "systemGray": .systemGray,
        "systemGray2": .systemGray,
        "systemGray3": .systemGray,
        "systemGray4": .systemGray,
        "systemGray5": .systemGray,
        "systemGray6": .systemGray,
    ]
    return colors[name].map { Color(nsColor: $0) }
    #endif
}

private func adaptive(light: Color, dark: Color) -> Color {
    #if canImport(UIKit)
    let light = UIColor(light), dark = UIColor(dark)
    return Color(uiColor: UIColor { $0.userInterfaceStyle == .dark ? dark : light })
    #else
    let light = NSColor(light), dark = NSColor(dark)
    return Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? dark : light })
    #endif
}

// MARK: - Fills (foregroundStyle, background, shape fill and stroke)

/// A fill: any color, a hierarchical level of the current foreground
/// ("primary"…"quinary"), a material ("thinMaterial"…), or a gradient:
/// `{ gradient: [color | { color, location }], type?: "linear" | "radial" | "angular",
///    start?, end?, center?, startRadius?, endRadius? }`.
func fill(_ value: Any?) -> AnyShapeStyle? {
    switch value {
    case let name as String:
        switch name {
        case "primary": return AnyShapeStyle(.primary)
        case "secondary": return AnyShapeStyle(.secondary)
        case "tertiary": return AnyShapeStyle(.tertiary)
        case "quaternary": return AnyShapeStyle(.quaternary)
        case "quinary": return AnyShapeStyle(.quinary)
        default: break
        }
        if let material = material(name) { return AnyShapeStyle(material) }
        return color(name).map(AnyShapeStyle.init)
    case let spec as [String: Any] where spec["gradient"] != nil:
        return gradient(spec)
    case let spec as [String: Any]:
        return color(spec).map(AnyShapeStyle.init)
    default:
        return nil
    }
}

private func gradient(_ spec: [String: Any]) -> AnyShapeStyle {
    let items = spec["gradient"] as? [Any] ?? []
    let stops: [Gradient.Stop] = items.enumerated().compactMap { index, item in
        if let stop = item as? [String: Any], let c = color(stop["color"]) {
            let location = (stop["location"] as? NSNumber).map { CGFloat($0.doubleValue) }
            return .init(color: c, location: location ?? CGFloat(index) / CGFloat(max(items.count - 1, 1)))
        }
        return color(item).map { .init(color: $0, location: CGFloat(index) / CGFloat(max(items.count - 1, 1))) }
    }
    let g = Gradient(stops: stops.isEmpty ? [.init(color: .clear, location: 0)] : stops)
    func number(_ key: String) -> CGFloat? { (spec[key] as? NSNumber).map { CGFloat($0.doubleValue) } }
    let center = unitPoint(spec["center"] as? String) ?? .center
    switch spec["type"] as? String {
    case "radial":
        return AnyShapeStyle(RadialGradient(gradient: g, center: center, startRadius: number("startRadius") ?? 0, endRadius: number("endRadius") ?? 200))
    case "angular":
        return AnyShapeStyle(AngularGradient(gradient: g, center: center))
    default:
        return AnyShapeStyle(LinearGradient(gradient: g, startPoint: unitPoint(spec["start"] as? String) ?? .top,
                                            endPoint: unitPoint(spec["end"] as? String) ?? .bottom))
    }
}

func material(_ name: String) -> Material? {
    switch name {
    case "ultraThinMaterial": .ultraThinMaterial
    case "thinMaterial": .thinMaterial
    case "regularMaterial": .regularMaterial
    case "thickMaterial": .thickMaterial
    case "ultraThickMaterial": .ultraThickMaterial
    case "bar": .bar
    default: nil
    }
}

func unitPoint(_ name: String?) -> UnitPoint? {
    switch name {
    case "top": .top
    case "center": .center
    case "bottom": .bottom
    case "leading": .leading
    case "trailing": .trailing
    case "topLeading": .topLeading
    case "topTrailing": .topTrailing
    case "bottomLeading": .bottomLeading
    case "bottomTrailing": .bottomTrailing
    default: nil
    }
}

// MARK: - Fonts

/// A font prop: a text style ("headline"…), or `{ size?, weight?, design?,
/// width?, name?, relativeTo? }`. `name` is a custom font, scaled with
/// Dynamic Type relative to `relativeTo` (default body); `size` alone is a
/// fixed-size system font.
func font(_ value: Any?) -> Font? {
    switch value {
    case let name as String:
        return fontStyle(name).map { .system($0) }
    case let spec as [String: Any]:
        let size = (spec["size"] as? NSNumber).map { CGFloat($0.doubleValue) }
        let style = (spec["relativeTo"] as? String).flatMap(fontStyle)
        let weight = (spec["weight"] as? String).flatMap(fontWeight)
        let design = (spec["design"] as? String).flatMap(fontDesign)
        var font: Font
        if let name = spec["name"] as? String {
            font = .custom(name, size: size ?? 17, relativeTo: style ?? .body)
            if let weight { font = font.weight(weight) }
        } else if let size {
            font = .system(size: size, weight: weight, design: design)
        } else {
            font = .system(style ?? .body, design: design, weight: weight)
        }
        if let width = (spec["width"] as? String).flatMap(fontWidth) { font = font.width(width) }
        return font
    default:
        return nil
    }
}

func fontWidth(_ name: String) -> Font.Width? {
    switch name {
    case "compressed": .compressed
    case "condensed": .condensed
    case "standard": .standard
    case "expanded": .expanded
    default: nil
    }
}

// MARK: - Corner shape (cornerRadius, border)

/// `cornerRadius`: a number, "capsule", or `{ topLeading, topTrailing,
/// bottomLeading, bottomTrailing }`.
struct Corners: Equatable {
    var radii = RectangleCornerRadii()
    var capsule = false

    init(_ value: Any?) {
        switch value {
        case let n as NSNumber:
            let r = CGFloat(n.doubleValue)
            radii = RectangleCornerRadii(topLeading: r, bottomLeading: r, bottomTrailing: r, topTrailing: r)
        case let s as String:
            capsule = s == "capsule" || s == "circle"
        case let d as [String: Any]:
            func r(_ key: String) -> CGFloat { (d[key] as? NSNumber).map { CGFloat($0.doubleValue) } ?? 0 }
            radii = RectangleCornerRadii(topLeading: r("topLeading"), bottomLeading: r("bottomLeading"),
                                         bottomTrailing: r("bottomTrailing"), topTrailing: r("topTrailing"))
        default:
            break
        }
    }

    var isSquare: Bool {
        !capsule && radii.topLeading == 0 && radii.topTrailing == 0 && radii.bottomLeading == 0 && radii.bottomTrailing == 0
    }
}

/// The box's outline, for clipping (`unbounded`: no corners means no clip, so
/// children's shadows and overflow still show) and for `border`.
struct BoxShape: InsettableShape {
    var corners: Corners
    var unbounded = false
    var inset: CGFloat = 0

    var animatableData: AnimatablePair<AnimatablePair<CGFloat, CGFloat>, AnimatablePair<CGFloat, CGFloat>> {
        get {
            AnimatablePair(AnimatablePair(corners.radii.topLeading, corners.radii.topTrailing),
                           AnimatablePair(corners.radii.bottomLeading, corners.radii.bottomTrailing))
        }
        set {
            corners.radii = RectangleCornerRadii(topLeading: newValue.first.first, bottomLeading: newValue.second.first,
                                                 bottomTrailing: newValue.second.second, topTrailing: newValue.first.second)
        }
    }

    func path(in rect: CGRect) -> Path {
        let rect = rect.insetBy(dx: inset, dy: inset)
        if corners.capsule { return Capsule(style: .continuous).path(in: rect) }
        if corners.isSquare { return Path(unbounded ? rect.insetBy(dx: -1e6, dy: -1e6) : rect) }
        return UnevenRoundedRectangle(cornerRadii: corners.radii, style: .continuous).path(in: rect)
    }

    func inset(by amount: CGFloat) -> BoxShape {
        var copy = self
        copy.inset += amount
        return copy
    }
}

// MARK: - Shapes

/// `<Rectangle>`, `<RoundedRectangle cornerRadius>`, `<Circle>`, `<Ellipse>`,
/// `<Capsule>`: `fill` (default: the foreground style), `stroke` with
/// `lineWidth` and `dash` (drawn inside the frame), and `trim={[from, to]}`
/// for partial strokes (progress rings). Shapes fill the space they're
/// offered, so give them a `frame`.
struct ShapeView: View {
    let node: Node

    var body: some View {
        switch node.type {
        case "Circle": draw(Circle())
        case "Ellipse": draw(Ellipse())
        case "Capsule": draw(Capsule(style: .continuous))
        case "RoundedRectangle": draw(BoxShape(corners: Corners(node.prop("cornerRadius"))))
        default: draw(Rectangle())
        }
    }

    private func draw<S: InsettableShape>(_ shape: S) -> some View {
        let fillStyle = fill(node.prop("fill"))
        let strokeStyle = fill(node.prop("stroke"))
        let width = node.cgFloat("lineWidth") ?? 1
        let dash = (node.prop("dash") as? [Any])?.compactMap { ($0 as? NSNumber).map { CGFloat($0.doubleValue) } } ?? []
        let style = StrokeStyle(lineWidth: width, lineCap: dash.isEmpty ? .round : .butt, dash: dash)
        let trim = (node.prop("trim") as? [Any])?.compactMap { ($0 as? NSNumber).map { CGFloat($0.doubleValue) } }
        return ZStack {
            if fillStyle != nil || strokeStyle == nil {
                shape.fill(fillStyle ?? AnyShapeStyle(.foreground))
            }
            if let strokeStyle {
                if let trim, trim.count == 2 {
                    shape.inset(by: width / 2).trim(from: trim[0], to: trim[1]).stroke(strokeStyle, style: style)
                } else {
                    shape.strokeBorder(strokeStyle, style: style)
                }
            }
        }
    }
}

// MARK: - SF Symbols

/// `symbolRenderingMode` (with `paletteColors` for "palette"),
/// `symbolVariant`, and `symbolEffect`: `{ type, value }` plays a one-shot
/// effect (bounce, wiggle, rotate) whenever `value` changes; `{ type, active }`
/// runs a continuous one (pulse, variableColor, breathe, rotate, wiggle) while
/// active. Changing `systemName` animates with the "replace" effect.
struct SymbolModifier: ViewModifier {
    let node: Node

    func body(content: Content) -> some View {
        let palette = (node.prop("paletteColors") as? [Any])?.compactMap(color) ?? []
        content
            .symbolRenderingMode(renderingMode(node.string("symbolRenderingMode")))
            .symbolVariant(variant(node.string("symbolVariant")))
            .modifier(Palette(colors: palette))
            .contentTransition(.symbolEffect(.replace))
            .modifier(Effect(spec: node.dict("symbolEffect")))
    }

    private func renderingMode(_ name: String?) -> SymbolRenderingMode? {
        switch name {
        case "monochrome": .monochrome
        case "hierarchical": .hierarchical
        case "palette": .palette
        case "multicolor": .multicolor
        default: nil
        }
    }

    private func variant(_ name: String?) -> SymbolVariants {
        switch name {
        case "fill": .fill
        case "circle": .circle
        case "square": .square
        case "rectangle": .rectangle
        case "slash": .slash
        case "circleFill": .circle.fill
        default: .none
        }
    }

    private struct Palette: ViewModifier {
        let colors: [Color]
        func body(content: Content) -> some View {
            switch colors.count {
            case 0: content
            case 1: content.foregroundStyle(colors[0])
            case 2: content.foregroundStyle(colors[0], colors[1])
            default: content.foregroundStyle(colors[0], colors[1], colors[2])
            }
        }
    }

    private struct Effect: ViewModifier {
        let spec: [String: Any]?

        func body(content: Content) -> some View {
            let type = spec?["type"] as? String
            let active = spec?["active"] as? Bool ?? true
            // Any value works as the trigger; compare its description.
            let trigger = spec?["value"].map { "\($0)" } ?? ""
            switch type {
            case "bounce": content.symbolEffect(.bounce, value: trigger)
            case "wiggle" where spec?["value"] != nil: content.symbolEffect(.wiggle, value: trigger)
            case "wiggle": content.symbolEffect(.wiggle, isActive: active)
            case "rotate" where spec?["value"] != nil: content.symbolEffect(.rotate, value: trigger)
            case "rotate": content.symbolEffect(.rotate, isActive: active)
            case "pulse": content.symbolEffect(.pulse, isActive: active)
            case "variableColor": content.symbolEffect(.variableColor.iterative, isActive: active)
            case "breathe": content.symbolEffect(.breathe, isActive: active)
            default: content
            }
        }
    }
}

// MARK: - Styled text

/// A `<Text>`'s content as one SwiftUI Text: strings, nested `<Text>` runs
/// with their own styling, and inline `<Image systemName>` symbols.
@MainActor
func styledText(_ node: Node) -> Text {
    if node.children.count == 1, node.children[0].type == "#text" {
        return Text(verbatim: cased(node.children[0].text, node))
    }
    return node.children.reduce(Text(verbatim: "")) { text, child in
        switch child.type {
        case "#text": text + Text(verbatim: cased(child.text, node))
        case "Text": text + run(child, inheritedCase: node.string("textCase"))
        case "Image": text + inlineSymbol(child)
        default: text
        }
    }
}

@MainActor
private func run(_ node: Node, inheritedCase: String?) -> Text {
    var text = styledText(node)
    if inheritedCase != nil, node.string("textCase") == nil {
        text = Text(verbatim: cased(node.textContent, inheritedCase))
    }
    if let f = font(node.prop("font")) { text = text.font(f) }
    if let w = node.string("fontWeight").flatMap(fontWeight) { text = text.fontWeight(w) }
    if let d = node.string("fontDesign").flatMap(fontDesign) { text = text.fontDesign(d) }
    if let style = fill(node.prop("foregroundStyle")) { text = text.foregroundStyle(style) }
    if node.bool("bold") { text = text.bold() }
    if node.bool("italic") { text = text.italic() }
    if let underline = node.prop("underline"), (underline as? Bool) != false { text = text.underline(true, color: color(underline)) }
    if node.bool("strikethrough") { text = text.strikethrough() }
    if let k = node.cgFloat("kerning") { text = text.kerning(k) }
    if let b = node.cgFloat("baselineOffset") { text = text.baselineOffset(b) }
    if node.bool("monospacedDigit") { text = text.monospacedDigit() }
    return text
}

@MainActor
private func inlineSymbol(_ node: Node) -> Text {
    var text = Text(Image(systemName: node.string("systemName") ?? "questionmark"))
    if let style = fill(node.prop("foregroundStyle")) { text = text.foregroundStyle(style) }
    if let f = font(node.prop("font")) { text = text.font(f) }
    return text
}

@MainActor
private func cased(_ string: String, _ node: Node) -> String {
    cased(string, node.string("textCase"))
}

private func cased(_ string: String, _ textCase: String?) -> String {
    switch textCase {
    case "uppercase": string.uppercased()
    case "lowercase": string.lowercased()
    default: string
    }
}
