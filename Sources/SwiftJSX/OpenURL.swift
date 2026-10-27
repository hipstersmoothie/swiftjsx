import Foundation
#if canImport(UIKit)
import SafariServices
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// `openURL(url, { inApp })` from JS.
@MainActor
func openExternal(_ url: URL, inApp: Bool) {
    #if canImport(UIKit)
    let web = url.scheme == "http" || url.scheme == "https"
    if inApp, web, let presenter = topViewController() {
        presenter.present(SFSafariViewController(url: url), animated: true)
    } else {
        UIApplication.shared.open(url)
    }
    #elseif canImport(AppKit)
    NSWorkspace.shared.open(url)
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
