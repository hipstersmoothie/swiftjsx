import SwiftUI

extension EnvironmentValues {
    @Entry var jsxRuntime: JSXRuntime? = nil
}

/// Mounts a `JSXRuntime`'s React tree as SwiftUI.
public struct ReactView: View {
    let runtime: JSXRuntime
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.verticalSizeClass) private var verticalSizeClass
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var screen = Screen()

    /// The root's size and safe-area insets, rounded to whole points.
    struct Screen: Equatable {
        var width = 0.0, height = 0.0, top = 0.0, bottom = 0.0, leading = 0.0, trailing = 0.0
    }

    public init(runtime: JSXRuntime) {
        self.runtime = runtime
    }

    private var environment: [String: String] {
        func sizeClass(_ c: UserInterfaceSizeClass?) -> String { c == .compact ? "compact" : "regular" }
        return [
            "horizontalSizeClass": sizeClass(horizontalSizeClass),
            "verticalSizeClass": sizeClass(verticalSizeClass),
            "colorScheme": colorScheme == .dark ? "dark" : "light",
            "dynamicTypeSize": "\(dynamicTypeSize)",
            "isAccessibilitySize": dynamicTypeSize.isAccessibilitySize ? "true" : "false",
            "width": "\(screen.width)", "height": "\(screen.height)",
            "safeTop": "\(screen.top)", "safeBottom": "\(screen.bottom)",
            "safeLeading": "\(screen.leading)", "safeTrailing": "\(screen.trailing)",
        ]
    }

    public var body: some View {
        ZStack {
            Children(node: runtime.tree.root)
            if let error = runtime.error {
                RedBox(message: error)
            }
        }
        .background { Presenters(node: runtime.tree.root) }
        .onGeometryChange(for: Screen.self) { proxy in
            let insets = proxy.safeAreaInsets
            return Screen(width: (proxy.size.width + insets.leading + insets.trailing).rounded(),
                          height: (proxy.size.height + insets.top + insets.bottom).rounded(),
                          top: insets.top.rounded(), bottom: insets.bottom.rounded(),
                          leading: insets.leading.rounded(), trailing: insets.trailing.rounded())
        } action: { screen = $0 }
        .environment(\.jsxRuntime, runtime)
        // useEnvironment() / useColorScheme() in JS.
        .onChange(of: environment, initial: true) { _, values in runtime.setEnvironment(values) }
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
    static let selfTinted: Set<String> = ["Button", "Toggle", "Slider", "ProgressView", "Stepper", "Picker", "DatePicker", "Menu", "TextField", "TextEditor"]

    private func fire(_ event: String, _ payload: Any? = nil) {
        runtime?.dispatch(node.id, event, payload)
    }

    private static func number(_ v: Any?) -> Double? { (v as? NSNumber)?.doubleValue }

    @ViewBuilder private var content: some View {
        if Self.selfTinted.contains(node.type) {
            control.modifier(TintModifier(node: node))
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
            let strikethrough = node.prop("strikethrough")
            // `markdown`: inline Markdown (bold, italic, code, links that open).
            let base = node.string("markdown").map { markdownText($0) } ?? styledText(node)
            let text = base
                .strikethrough(strikethrough != nil && (strikethrough as? Bool) != false, color: color(strikethrough))
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
            .contentTransition(textTransition(node))
            .modifier(Selectable(enabled: node.bool("selectable")))

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

        case "VirtualRow", "NavigationPage", "ToolbarItem", "MenuLabel", "VirtualListHeader", "VirtualListFooter":
            Children(node: node)

        case "NavigationStack":
            NavigationStackHost(node: node)

        case "Chart":
            ChartHost(node: node)

        case "NavigationSplitView":
            SplitViewHost(node: node)

        case "TabView":
            TabViewHost(node: node)

        case "Screen":
            ScreenHost(node: node)

        case "List":
            SelectableList(node: node)

        case "Form":
            Form { Children(node: node) }
                .scrollContentBackground(node.string("scrollContentBackground") == "hidden" ? .hidden : .automatic)
                .modifier(ScrollRequests(node: node))

        case "Section":
            // Header and footer: a string prop, or <SectionHeader> / <SectionFooter> children.
            let header = node.children.first { $0.type == "SectionHeader" }
            let footer = node.children.first { $0.type == "SectionFooter" }
            Section {
                EditableChildren(node: node)
            } header: {
                if let header { HStack { Children(node: header) }.modifier(Decorations(node: header)) }
                else if let title = node.string("header") { Text(title) }
            } footer: {
                if let footer { HStack { Children(node: footer) }.modifier(Decorations(node: footer)) }
                else if let title = node.string("footer") { Text(title) }
            }

        case "Grid":
            Grid(alignment: alignment(node.string("alignment")) ?? .center,
                 horizontalSpacing: node.cgFloat("horizontalSpacing"), verticalSpacing: node.cgFloat("verticalSpacing")) {
                Children(node: node)
            }

        case "GridRow":
            GridRow(alignment: verticalAlignment(node.string("alignment"))) { Children(node: node) }

        case "Flow":
            FlowLayout(spacing: node.cgFloat("spacing") ?? 8, lineSpacing: node.cgFloat("lineSpacing") ?? node.cgFloat("spacing") ?? 8,
                       alignment: horizontalAlignment(node.string("alignment") ?? "leading")) {
                Children(node: node)
            }

        case "Image":
            if node.has("src") {
                RemoteImage(node: node)
            } else if let name = node.string("name") {
                Image(name).resizable().aspectRatio(contentMode: node.string("contentMode") == "fill" ? .fill : .fit)
            } else {
                let image = Image(systemName: node.string("systemName") ?? "questionmark", variableValue: node.double("variableValue"))
                Group {
                    if node.bool("resizable") {
                        image.resizable().aspectRatio(contentMode: node.string("contentMode") == "fill" ? .fill : .fit)
                    } else {
                        image.imageScale(parseImageScale(node.string("imageScale")))
                    }
                }
                .modifier(SymbolModifier(node: node))
            }

        case "Label":
            Label(node.string("title") ?? "", systemImage: node.string("systemImage") ?? "")

        case "Rectangle", "RoundedRectangle", "Circle", "Ellipse", "Capsule", "Path", "Polyline":
            ShapeView(node: node)

        case "LabeledContent":
            LabeledContent {
                Children(node: node)
            } label: {
                Text(node.string("label") ?? "")
            }

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
                if let title = node.string("title") {
                    if let icon = node.string("systemImage") { Label(title, systemImage: icon) } else { Text(title) }
                } else {
                    Children(node: node)
                }
            }
            .modifier(ButtonStyleModifier(node: node))
            .modifier(KeyboardShortcutModifier(spec: node.prop("keyboardShortcut")))

        case "DatePicker":
            DatePickerHost(node: node)

        case "ColorPicker":
            ColorPickerHost(node: node)

        case "Menu":
            MenuHost(node: node)

        #if os(iOS)
        case "EditButton":
            EditButton()
        #endif

        case "TextField", "TextEditor":
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
                // onEditingChange(true/false): the finger went down / up (scrubbing).
                let editing: (Bool) -> Void = { runtime?.dispatch(node.id, "onEditingChange", $0) }
                if let step = node.double("step") {
                    Slider(value: value, in: range, step: step, onEditingChanged: editing)
                } else {
                    Slider(value: value, in: range, onEditingChanged: editing)
                }
            }

        case "Stepper":
            Controlled(node: node, fallback: 0.0, read: Self.number) { value in
                Stepper(value: value, in: (node.double("min") ?? -.infinity)...(node.double("max") ?? .infinity), step: node.double("step") ?? 1) {
                    if let label = node.string("label") { Text(label) } else { Children(node: node) }
                }
                // No label at all: just the −/+ control, compact in a row.
                .labelsHidden(node.string("label") == nil && !node.children.contains { !$0.isAttachment })
            }

        case "Picker":
            let options = (node.props["options"] as? [[String: Any]]) ?? []
            Controlled(node: node, fallback: "") { selection in
                Picker(node.string("label") ?? "", selection: selection) {
                    ForEach(options.indices, id: \.self) { i in
                        if let icon = options[i]["systemImage"] as? String {
                            Label(options[i]["label"] as? String ?? "", systemImage: icon).tag(options[i]["value"] as? String ?? "")
                        } else {
                            Text(options[i]["label"] as? String ?? "").tag(options[i]["value"] as? String ?? "")
                        }
                    }
                }
                .modifier(PickerStyleModifier(style: node.string("pickerStyle")))
                .labelsHidden(node.string("label") == nil)
            }

        default:
            Text("Unknown <\(node.type)>")
                .foregroundStyle(.red)
                .font(.caption.monospaced())
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

@MainActor func gridColumns(_ node: Node) -> [GridItem] {
    let spacing = node.cgFloat("spacing")
    if let adaptive = node.dict("columns") {
        let min = (adaptive["minimum"] as? NSNumber).map { CGFloat($0.doubleValue) } ?? 80
        let max = (adaptive["maximum"] as? NSNumber).map { CGFloat($0.doubleValue) } ?? .infinity
        return [GridItem(.adaptive(minimum: min, maximum: max), spacing: spacing)]
    }
    let count = max(1, Int(node.double("columns") ?? 2))
    return Array(repeating: GridItem(.flexible(), spacing: spacing), count: count)
}
