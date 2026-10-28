import SwiftUI

// Text input, date and color pickers, menus.

/// `<TextField>` and `<TextEditor>`: controlled text input with focus
/// (`focused`, `ref.focus()`, `autoFocus`, onFocus/onBlur), the selection
/// (`selection` / `onSelectionChange`, UTF-16 offsets like JS strings), hardware
/// keys (`onKeyPress`) and keyboard options.
struct TextFieldHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @FocusState private var focused: Bool
    @State private var selection: TextSelection?
    /// The last selection JS set, to apply only changes to it.
    @State private var appliedSelection: [Int]?

    /// Selection-aware fields (a ref can call setSelection).
    private var tracksSelection: Bool { node.has("onSelectionChange") || node.has("selection") || node.has("__ref") }

    var body: some View {
        Controlled(node: node, fallback: "") { text in
            let placeholder = node.string("placeholder") ?? ""
            Group {
                if node.type == "TextEditor" {
                    editor(text)
                        .scrollContentBackground(node.string("scrollContentBackground") == "hidden" ? .hidden : .automatic)
                        .overlay(alignment: .topLeading) {
                            // TextEditor has no placeholder of its own.
                            if text.wrappedValue.isEmpty, !placeholder.isEmpty {
                                Text(placeholder).foregroundStyle(.tertiary).padding(.top, 8).padding(.leading, 5).allowsHitTesting(false)
                            }
                        }
                } else if node.bool("secure") {
                    SecureField(placeholder, text: text)
                } else if node.string("axis") == "vertical" {
                    // Grows with its text, between minLines and maxLines.
                    Group {
                        if tracksSelection {
                            TextField(placeholder, text: text, selection: $selection, axis: .vertical)
                        } else {
                            TextField(placeholder, text: text, axis: .vertical)
                        }
                    }
                    .lineLimit(lineRange)
                } else if tracksSelection {
                    TextField(placeholder, text: text, selection: $selection)
                } else {
                    TextField(placeholder, text: text)
                }
            }
            .focused($focused)
            .onChange(of: selection) { _, value in
                guard node.has("onSelectionChange"), let range = offsets(value, in: text.wrappedValue) else { return }
                runtime?.dispatch(node.id, "onSelectionChange", ["start": range[0], "end": range[1]])
            }
            .onChange(of: node.selectionRequest) { _, request in
                // Focusing puts the cursor at the end: focus first, then select.
                let wasFocused = focused
                focused = true
                Task { @MainActor in
                    if !wasFocused { try? await Task.sleep(for: .milliseconds(80)) }
                    selection = textSelection([request.start, request.end], in: text.wrappedValue)
                }
            }
            .onChange(of: selectionProp, initial: true) { _, wanted in
                guard let wanted, wanted != appliedSelection else { return }
                appliedSelection = wanted
                selection = textSelection(wanted, in: text.wrappedValue)
            }
        }
        .modifier(FieldStyle(node: node))
        .multilineTextAlignment(textAlignment(node.string("textAlignment")))
        .submitLabel(parseSubmitLabel(node.string("submitLabel")))
        .autocorrectionDisabled(node.has("autocorrect") && !node.bool("autocorrect"))
        #if os(iOS)
        .keyboardType(parseKeyboardType(node.string("keyboardType")))
        .textInputAutocapitalization(parseAutocapitalization(node.string("autocapitalize")))
        .textContentType(parseContentType(node.string("textContentType")))
        #endif
        .onSubmit {
            runtime?.dispatch(node.id, "onSubmit")
            // Keep the keyboard up for rapid entry (add another, another…).
            if node.has("blurOnSubmit"), !node.bool("blurOnSubmit") { focused = true }
        }
        .task {
            // After a sheet's presentation settles, or focus doesn't stick.
            guard node.bool("autoFocus") else { return }
            try? await Task.sleep(for: .milliseconds(350))
            focused = true
        }
        .onChange(of: node.focusRequest) { _, request in focused = request.focused }
        // `focused`: controlled focus (move it between fields with state).
        .onChange(of: node.prop("focused") as? Bool) { _, wanted in
            if let wanted, wanted != focused { focused = wanted }
        }
        .task {
            guard node.prop("focused") as? Bool == true else { return }
            try? await Task.sleep(for: .milliseconds(350))
            focused = true
        }
        .modifier(FieldKeys(node: node))
        #if os(iOS)
        .modifier(DeleteBackward(node: node, focused: focused))
        #endif
        .onChange(of: focused) { _, isFocused in
            runtime?.dispatch(node.id, isFocused ? "onFocus" : "onBlur")
        }
    }

    @ViewBuilder private func editor(_ text: Binding<String>) -> some View {
        if tracksSelection { TextEditor(text: text, selection: $selection) } else { TextEditor(text: text) }
    }

    /// `selection` from JS as [start, end].
    private var selectionProp: [Int]? {
        guard let dict = node.dict("selection") else { return nil }
        let start = (dict["start"] as? NSNumber)?.intValue ?? 0
        return [start, (dict["end"] as? NSNumber)?.intValue ?? start]
    }

    /// A selection as UTF-16 offsets (JS string indices).
    private func offsets(_ selection: TextSelection?, in text: String) -> [Int]? {
        guard let selection else { return nil }
        let range: Range<String.Index>? = switch selection.indices {
        case .selection(let range): range
        case .multiSelection(let set): set.ranges.first
        @unknown default: nil
        }
        guard let range else { return nil }
        let utf16 = text.utf16
        func offset(_ index: String.Index) -> Int {
            utf16.distance(from: utf16.startIndex, to: min(index, text.endIndex))
        }
        return [offset(range.lowerBound), offset(range.upperBound)]
    }

    private func textSelection(_ offsets: [Int], in text: String) -> TextSelection {
        let count = text.utf16.count
        let start = String.Index(utf16Offset: min(max(offsets[0], 0), count), in: text)
        let end = String.Index(utf16Offset: min(max(offsets[1], offsets[0]), count), in: text)
        return start == end ? TextSelection(insertionPoint: start) : TextSelection(range: start..<end)
    }

    /// `onKeyPress` on a field (hardware keyboards): reported, and consumed
    /// only for the `keys` listed (so typing still works).
    private struct FieldKeys: ViewModifier {
        let node: Node
        @Environment(\.jsxRuntime) private var runtime
        func body(content: Content) -> some View {
            if node.has("onKeyPress") {
                content.onKeyPress(phases: .down) { press in
                    let key = KeyPressModifier.name(press)
                    runtime?.fire(node, "onKeyPress", ["key": key, "characters": press.characters,
                                                       "modifiers": KeyPressModifier.modifiers(press.modifiers)])
                    return (node.prop("keys") as? [String])?.contains(key) == true ? .handled : .ignored
                }
            } else {
                content
            }
        }
    }

    private var lineRange: ClosedRange<Int> {
        let min = Int(node.double("minLines") ?? 1)
        let max = Int(node.double("maxLines") ?? 1000)
        return min...Swift.max(min, max)
    }

    private struct FieldStyle: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            switch (node.type, node.string("textFieldStyle")) {
            case ("TextEditor", _): content
            case (_, "plain"): content.textFieldStyle(.plain)
            case (_, "automatic"): content.textFieldStyle(.automatic)
            default: content.textFieldStyle(.roundedBorder)
            }
        }
    }
}

private func parseSubmitLabel(_ name: String?) -> SubmitLabel {
    switch name {
    case "done": .done
    case "go": .go
    case "send": .send
    case "join": .join
    case "route": .route
    case "search": .search
    case "next": .next
    case "continue": .continue
    default: .return
    }
}

#if os(iOS)
private func parseKeyboardType(_ name: String?) -> UIKeyboardType {
    switch name {
    case "email": .emailAddress
    case "number": .numberPad
    case "decimal": .decimalPad
    case "phone": .phonePad
    case "url": .URL
    case "numbersAndPunctuation": .numbersAndPunctuation
    case "webSearch": .webSearch
    case "asciiCapable": .asciiCapable
    default: .default
    }
}

private func parseAutocapitalization(_ name: String?) -> TextInputAutocapitalization? {
    switch name {
    case "none": .never
    case "sentences": .sentences
    case "words": .words
    case "characters": .characters
    default: nil
    }
}

private func parseContentType(_ name: String?) -> UITextContentType? {
    switch name {
    case "name": .name
    case "givenName": .givenName
    case "familyName": .familyName
    case "nickname": .nickname
    case "email": .emailAddress
    case "phone": .telephoneNumber
    case "username": .username
    case "password": .password
    case "newPassword": .newPassword
    case "oneTimeCode": .oneTimeCode
    case "url": .URL
    case "streetAddress": .fullStreetAddress
    case "postalCode": .postalCode
    case "city": .addressCity
    case "country": .countryName
    case "organization": .organizationName
    case "jobTitle": .jobTitle
    case "creditCardNumber": .creditCardNumber
    case "creditCardExpiration": .creditCardExpiration
    case "creditCardSecurityCode": .creditCardSecurityCode
    case "creditCardName": .creditCardName
    case "streetAddressLine1": .streetAddressLine1
    case "streetAddressLine2": .streetAddressLine2
    case "state": .addressState
    case "cityAndState": .addressCityAndState
    case "birthdate": .birthdate
    default: nil
    }
}
#endif

/// `<DatePicker>`: the value is milliseconds since 1970 on the wire (the JS
/// component takes and gives `Date`s).
struct DatePickerHost: View {
    let node: Node

    var body: some View {
        Controlled(node: node, fallback: Date().timeIntervalSince1970 * 1000, read: { ($0 as? NSNumber)?.doubleValue }) { ms in
            let date = Binding<Date>(
                get: { Date(timeIntervalSince1970: ms.wrappedValue / 1000) },
                set: { ms.wrappedValue = $0.timeIntervalSince1970 * 1000 }
            )
            let range = (node.double("min").map { Date(timeIntervalSince1970: $0 / 1000) } ?? .distantPast)
                ... (node.double("max").map { Date(timeIntervalSince1970: $0 / 1000) } ?? .distantFuture)
            DatePicker(node.string("label") ?? "", selection: date, in: range, displayedComponents: components)
                .modifier(Style(style: node.string("datePickerStyle")))
                .labelsHidden(node.string("label") == nil)
        }
    }

    private var components: DatePickerComponents {
        switch node.string("components") {
        case "hourAndMinute": .hourAndMinute
        case "dateAndTime": [.date, .hourAndMinute]
        default: .date
        }
    }

    private struct Style: ViewModifier {
        let style: String?
        func body(content: Content) -> some View {
            switch style {
            case "graphical": content.datePickerStyle(.graphical)
            #if os(iOS)
            case "wheel": content.datePickerStyle(.wheel)
            #endif
            case "compact": content.datePickerStyle(.compact)
            default: content
            }
        }
    }
}

/// `<ColorPicker>`: the value is a hex string ("#rrggbb", or "#rrggbbaa"
/// with `supportsOpacity`).
struct ColorPickerHost: View {
    let node: Node
    @Environment(\.self) private var environment

    var body: some View {
        Controlled(node: node, fallback: "#000000") { hex in
            let selection = Binding<Color>(
                get: { color(hex.wrappedValue) ?? .black },
                set: { hex.wrappedValue = Self.hex($0, in: environment, alpha: node.bool("supportsOpacity")) }
            )
            ColorPicker(node.string("label") ?? "", selection: selection, supportsOpacity: node.bool("supportsOpacity"))
                .labelsHidden(node.string("label") == nil)
        }
    }

    static func hex(_ color: Color, in environment: EnvironmentValues, alpha: Bool) -> String {
        let c = color.resolve(in: environment)
        func byte(_ v: Float) -> String { String(format: "%02x", Int((min(max(v, 0), 1) * 255).rounded())) }
        return "#" + byte(c.red) + byte(c.green) + byte(c.blue) + (alpha ? byte(c.opacity) : "")
    }
}

/// `<Menu title systemImage>`: a button that shows its children (Buttons,
/// Dividers, Sections, Pickers, nested Menus for submenus). With `onPress`,
/// tapping runs it and long-pressing shows the menu.
struct MenuHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime

    var body: some View {
        if node.has("onPress") {
            Menu { items } label: { label } primaryAction: { runtime?.dispatch(node.id, "onPress") }
        } else {
            Menu { items } label: { label }
        }
    }

    private var items: some View {
        ForEach(node.children.filter { !$0.isAttachment && $0.type != "MenuLabel" }) { NodeView(node: $0) }
    }

    /// `<MenuLabel>` (any view: a styled round button), or `title` / `systemImage`.
    @ViewBuilder private var label: some View {
        let title = node.string("title")
        let icon = node.string("systemImage")
        if let custom = node.children.first(where: { $0.type == "MenuLabel" }) {
            NodeView(node: custom)
        } else if let title, let icon {
            Label(title, systemImage: icon)
        } else if let icon {
            Image(systemName: icon)
        } else {
            Text(title ?? "")
        }
    }
}

extension View {
    @ViewBuilder func labelsHidden(_ hidden: Bool) -> some View {
        if hidden { labelsHidden() } else { self }
    }
}

/// `<Button>`. With `onLongPress`, holding fires it and a tap fires
/// `onPress`: the Button is drawn for its look, and tap and long-press
/// gestures (which SwiftUI arbitrates, in List rows too, where a gesture added
/// to a Button breaks its tap) take the touches; pressing dims it.
struct ButtonHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var pressing = false

    var body: some View {
        let button = Button(role: buttonRole(node.string("role"))) {
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
        if node.has("onLongPress") {
            button
                .allowsHitTesting(false)
                .opacity(pressing ? 0.55 : 1)
                .contentShape(Rectangle())
                .onTapGesture { fire("onPress") }
                .onLongPressGesture(minimumDuration: node.double("longPressDuration") ?? 0.5) {
                    fire("onLongPress")
                } onPressingChanged: { isPressing in
                    withAnimation(.easeOut(duration: 0.12)) { pressing = isPressing }
                }
                .accessibilityAddTraits(.isButton)
                .accessibilityAction { fire("onPress") }
        } else {
            button
        }
    }

    private func fire(_ event: String) {
        if node.has(event) { runtime?.fire(node, event) }
    }
}

#if os(iOS)
/// `onDeleteBackward({ empty })`: the delete key, from the software keyboard
/// too, including in an empty field (where the text doesn't change, so
/// onChange can't tell): OTP boxes and chip inputs step back on it. SwiftUI
/// has no hook; UIKit's text views' deleteBackward is swizzled once.
private struct DeleteBackward: ViewModifier {
    let node: Node
    let focused: Bool
    @Environment(\.jsxRuntime) private var runtime

    func body(content: Content) -> some View {
        if node.has("onDeleteBackward") {
            content
                .onAppear { DeleteBackwardHook.install() }
                .onReceive(NotificationCenter.default.publisher(for: DeleteBackwardHook.notification)) { note in
                    // The focused field is the one being typed in.
                    guard focused else { return }
                    runtime?.dispatch(node.id, "onDeleteBackward", ["empty": note.userInfo?["empty"] as? Bool ?? false])
                }
        } else {
            content
        }
    }
}

@MainActor
enum DeleteBackwardHook {
    static let notification = Notification.Name("SwiftJSXDeleteBackward")
    private static var installed = false

    static func install() {
        guard !installed else { return }
        installed = true
        for type in [UITextField.self, UITextView.self] as [AnyClass] {
            guard let original = class_getInstanceMethod(type, #selector(UIKeyInput.deleteBackward)),
                  let replacement = class_getInstanceMethod(type, #selector(UIView.swiftjsx_deleteBackward)) else { continue }
            // Our implementation on this class, then swap it with the original.
            class_addMethod(type, #selector(UIView.swiftjsx_deleteBackward), method_getImplementation(replacement), method_getTypeEncoding(replacement))
            guard let added = class_getInstanceMethod(type, #selector(UIView.swiftjsx_deleteBackward)) else { continue }
            method_exchangeImplementations(original, added)
        }
    }
}

extension UIView {
    /// Swapped with UITextField / UITextView deleteBackward: calling it here
    /// runs the original.
    @objc func swiftjsx_deleteBackward() {
        let text = (self as? UITextField)?.text ?? (self as? UITextView)?.text ?? ""
        swiftjsx_deleteBackward()
        NotificationCenter.default.post(name: DeleteBackwardHook.notification, object: self, userInfo: ["empty": text.isEmpty])
    }
}
#endif
