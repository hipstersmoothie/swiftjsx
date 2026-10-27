import SwiftUI

extension EnvironmentValues {
    @Entry var jsxRuntime: JSXRuntime? = nil
}

/// Mounts a `JSXRuntime`'s React tree as SwiftUI.
public struct ReactView: View {
    let runtime: JSXRuntime

    public init(runtime: JSXRuntime) {
        self.runtime = runtime
    }

    public var body: some View {
        ZStack {
            Children(node: runtime.tree.root)
            if let error = runtime.error {
                RedBox(message: error)
            }
        }
        .background { Presenters(node: runtime.tree.root) }
        .environment(\.jsxRuntime, runtime)
    }
}

/// A node's laid-out children (presentations like sheets are attached to the
/// parent by `Presenters` instead).
struct Children: View {
    let node: Node
    var body: some View {
        ForEach(node.children.filter { !$0.isAttachment }) { NodeView(node: $0) }
    }
}

/// Renders one host node. The `switch` is the whole "component library":
/// adding a SwiftUI view to JSX means adding a case here and a typed handle in
/// `js/components.ts`.
struct NodeView: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    var body: some View {
        content.modifier(Decorations(node: node))
    }

    /// Controls that take `tint` get it on the control itself (a Button in
    /// `<SwipeActions>` must stay a plain Button for its tint to color the action).
    private static let tinted: Set<String> = ["Toggle", "Slider", "ProgressView", "Stepper", "Picker"]

    private func fire(_ event: String, _ payload: Any? = nil) {
        runtime?.dispatch(node.id, event, payload)
    }

    private static func number(_ v: Any?) -> Double? { (v as? NSNumber)?.doubleValue }

    @ViewBuilder private var content: some View {
        if Self.tinted.contains(node.type) {
            control.tint(color(node.prop("tint")))
        } else {
            control
        }
    }

    @ViewBuilder private var control: some View {
        switch node.type {
        case "#text":
            Text(node.text)

        case "Text":
            // Font and color come from the modifiers (environment); the rest
            // are Text's own.
            let underline = node.prop("underline")
            let text = styledText(node)
                .strikethrough(node.bool("strikethrough"))
                .italic(node.bool("italic"))
                .bold(node.bool("bold"))
                .underline(underline != nil && (underline as? Bool) != false, color: color(underline))
                .kerning(node.cgFloat("kerning") ?? 0)
                .tracking(node.cgFloat("tracking") ?? 0)
            Group {
                if node.bool("monospacedDigit") { text.monospacedDigit() } else { text }
            }
            .lineLimit(node.double("lineLimit").map { Int($0) })
            .lineSpacing(node.cgFloat("lineSpacing") ?? 0)
            .minimumScaleFactor(node.cgFloat("minimumScaleFactor") ?? 1)
            .multilineTextAlignment(textAlignment(node.string("textAlignment")))
            .contentTransition(node.has("animation") ? .numericText() : .identity)

        case "VStack":
            VStack(alignment: horizontalAlignment(node.string("alignment")), spacing: node.cgFloat("spacing")) {
                Children(node: node)
            }

        case "HStack":
            HStack(alignment: verticalAlignment(node.string("alignment")), spacing: node.cgFloat("spacing")) {
                Children(node: node)
            }

        case "ZStack":
            ZStack(alignment: alignment(node.string("alignment")) ?? .center) { Children(node: node) }

        case "LazyVStack":
            LazyVStack(alignment: horizontalAlignment(node.string("alignment")), spacing: node.cgFloat("spacing")) {
                Children(node: node)
            }

        case "LazyHStack":
            LazyHStack(alignment: verticalAlignment(node.string("alignment")), spacing: node.cgFloat("spacing")) {
                Children(node: node)
            }

        case "LazyVGrid":
            LazyVGrid(columns: gridColumns(node), spacing: node.cgFloat("spacing")) { Children(node: node) }

        case "ScrollView":
            ScrollViewHost(node: node)

        case "VirtualList":
            VirtualListHost(node: node)

        case "VirtualRow", "NavigationPage", "ToolbarItem":
            Children(node: node)

        case "NavigationStack":
            NavigationStackHost(node: node)

        case "NavigationSplitView":
            SplitViewHost(node: node)

        case "TabView":
            TabViewHost(node: node)

        case "Screen":
            ScreenHost(node: node)

        case "List":
            List { Children(node: node) }

        case "Form":
            Form { Children(node: node) }

        case "Section":
            Section {
                Children(node: node)
            } header: {
                if let header = node.string("header") { Text(header) }
            } footer: {
                if let footer = node.string("footer") { Text(footer) }
            }

        case "Image":
            if node.has("src") {
                RemoteImage(node: node)
            } else {
                let image = node.string("name").map { Image($0) } ?? Image(systemName: node.string("systemName") ?? "questionmark")
                if node.bool("resizable") || node.has("name") {
                    image.resizable().aspectRatio(contentMode: node.string("contentMode") == "fill" ? .fill : .fit)
                } else {
                    image.imageScale(parseImageScale(node.string("imageScale")))
                }
            }

        case "Label":
            Label(node.string("title") ?? "", systemImage: node.string("systemImage") ?? "")

        case "Rectangle", "RoundedRectangle", "Circle", "Ellipse", "Capsule":
            ShapeView(node: node)

        case "Spacer":
            Spacer(minLength: node.cgFloat("minLength"))

        case "Divider":
            Divider()

        case "ProgressView":
            if let value = node.double("value") {
                ProgressView(value: value, total: node.double("total") ?? 1) {
                    if let label = node.string("label") { Text(label) }
                }
            } else {
                ProgressView {
                    if let label = node.string("label") { Text(label) }
                }
            }

        case "Button":
            Button(role: buttonRole(node.string("role"))) {
                fire("onPress")
            } label: {
                if let title = node.string("title") { Text(title) } else { Children(node: node) }
            }
            .modifier(ButtonStyleModifier(style: node.string("buttonStyle")))
            .tint(color(node.prop("tint")))

        case "TextField":
            TextFieldHost(node: node)

        case "Toggle":
            Controlled(node: node, fallback: false) { isOn in
                Toggle(isOn: isOn) {
                    if let label = node.string("label") { Text(label) } else { Children(node: node) }
                }
            }

        case "Slider":
            let range = (node.double("min") ?? 0)...(node.double("max") ?? 1)
            Controlled(node: node, fallback: range.lowerBound, read: Self.number) { value in
                if let step = node.double("step") {
                    Slider(value: value, in: range, step: step)
                } else {
                    Slider(value: value, in: range)
                }
            }

        case "Stepper":
            Controlled(node: node, fallback: 0.0, read: Self.number) { value in
                Stepper(value: value, in: (node.double("min") ?? -.infinity)...(node.double("max") ?? .infinity), step: node.double("step") ?? 1) {
                    if let label = node.string("label") { Text(label) } else { Children(node: node) }
                }
            }

        case "Picker":
            let options = (node.props["options"] as? [[String: Any]]) ?? []
            Controlled(node: node, fallback: "") { selection in
                Picker(node.string("label") ?? "", selection: selection) {
                    ForEach(options.indices, id: \.self) { i in
                        Text(options[i]["label"] as? String ?? "").tag(options[i]["value"] as? String ?? "")
                    }
                }
                .modifier(PickerStyleModifier(style: node.string("pickerStyle")))
            }

        default:
            Text("Unknown <\(node.type)>")
                .foregroundStyle(.red)
                .font(.caption.monospaced())
        }
    }
}

struct TextFieldHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @FocusState private var focused: Bool

    var body: some View {
        Controlled(node: node, fallback: "") { text in
            let placeholder = node.string("placeholder") ?? ""
            Group {
                if node.bool("secure") {
                    SecureField(placeholder, text: text)
                } else {
                    TextField(placeholder, text: text)
                }
            }
            .focused($focused)
        }
        .textFieldStyle(.roundedBorder)
        .onSubmit { runtime?.dispatch(node.id, "onSubmit") }
        .onChange(of: node.focusRequest) { _, request in focused = request.focused }
        .onChange(of: focused) { _, isFocused in
            runtime?.dispatch(node.id, isFocused ? "onFocus" : "onBlur")
        }
    }
}

/// React Native-style red box for uncaught JS errors.
struct RedBox: View {
    let message: String
    var body: some View {
        ScrollView {
            Text(message)
                .font(.system(.body, design: .monospaced))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .textSelection(.enabled)
        }
        .background(Color(red: 0.75, green: 0.1, blue: 0.1))
    }
}

@MainActor private func gridColumns(_ node: Node) -> [GridItem] {
    let spacing = node.cgFloat("spacing")
    if let adaptive = node.dict("columns") {
        let min = (adaptive["minimum"] as? NSNumber).map { CGFloat($0.doubleValue) } ?? 80
        let max = (adaptive["maximum"] as? NSNumber).map { CGFloat($0.doubleValue) } ?? .infinity
        return [GridItem(.adaptive(minimum: min, maximum: max), spacing: spacing)]
    }
    let count = max(1, Int(node.double("columns") ?? 2))
    return Array(repeating: GridItem(.flexible(), spacing: spacing), count: count)
}
