import SwiftUI

// Text input, date and color pickers, menus.

/// `<TextField>` and `<TextEditor>`: controlled text input with focus
/// (`ref.focus()`, `autoFocus`, onFocus/onBlur) and keyboard options.
struct TextFieldHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @FocusState private var focused: Bool

    var body: some View {
        Controlled(node: node, fallback: "") { text in
            let placeholder = node.string("placeholder") ?? ""
            Group {
                if node.type == "TextEditor" {
                    TextEditor(text: text)
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
                    TextField(placeholder, text: text, axis: .vertical)
                        .lineLimit(lineRange)
                } else {
                    TextField(placeholder, text: text)
                }
            }
            .focused($focused)
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
        .onChange(of: focused) { _, isFocused in
            runtime?.dispatch(node.id, isFocused ? "onFocus" : "onBlur")
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
            Menu { Children(node: node) } label: { label } primaryAction: { runtime?.dispatch(node.id, "onPress") }
        } else {
            Menu { Children(node: node) } label: { label }
        }
    }

    @ViewBuilder private var label: some View {
        let title = node.string("title")
        let icon = node.string("systemImage")
        if let title, let icon {
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
