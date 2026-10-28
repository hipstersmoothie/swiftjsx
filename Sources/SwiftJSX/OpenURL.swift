import Foundation
#if canImport(UIKit)
import SafariServices
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// `openURL(url, { inApp })` from JS.
@MainActor
func openExternal(_ url: URL, inApp: Bool, done: @escaping (Bool) -> Void = { _ in }) {
    #if canImport(UIKit)
    let web = url.scheme == "http" || url.scheme == "https"
    if inApp, web, let presenter = topViewController() {
        presenter.present(SFSafariViewController(url: url), animated: true)
        done(true)
    } else {
        UIApplication.shared.open(url) { done($0) }
    }
    #elseif canImport(AppKit)
    done(NSWorkspace.shared.open(url))
    #endif
}

/// Whether something can open the URL. Schemes other than http(s) must be
/// listed in the app's LSApplicationQueriesSchemes to answer true.
@MainActor
func canOpenExternal(_ url: URL) -> Bool {
    #if canImport(UIKit)
    UIApplication.shared.canOpenURL(url)
    #elseif canImport(AppKit)
    NSWorkspace.shared.urlForApplication(toOpen: url) != nil
    #endif
}

/// `haptic(kind)` from JS.
@MainActor
func playHaptic(_ kind: String?) {
    #if os(iOS)
    switch kind {
    case "success": UINotificationFeedbackGenerator().notificationOccurred(.success)
    case "warning": UINotificationFeedbackGenerator().notificationOccurred(.warning)
    case "error": UINotificationFeedbackGenerator().notificationOccurred(.error)
    case "selection": UISelectionFeedbackGenerator().selectionChanged()
    case "light": UIImpactFeedbackGenerator(style: .light).impactOccurred()
    case "heavy": UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    case "soft": UIImpactFeedbackGenerator(style: .soft).impactOccurred()
    case "rigid": UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
    default: UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    #endif
}

/// `navigator.clipboard` (text).
@MainActor
func writeClipboard(_ text: String) {
    #if canImport(UIKit)
    UIPasteboard.general.string = text
    #elseif canImport(AppKit)
    NSPasteboard.general.clearContents()
    NSPasteboard.general.setString(text, forType: .string)
    #endif
}

@MainActor
func readClipboard() -> String {
    #if canImport(UIKit)
    UIPasteboard.general.string ?? ""
    #elseif canImport(AppKit)
    NSPasteboard.general.string(forType: .string) ?? ""
    #endif
}

#if canImport(UIKit)
@MainActor
private func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    var top = scenes.flatMap(\.windows).first(where: \.isKeyWindow)?.rootViewController
    while let presented = top?.presentedViewController { top = presented }
    return top
}
#endif
