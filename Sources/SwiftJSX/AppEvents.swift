import Foundation
import Network
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// Fires the browser's window events in JS from the app's lifecycle:
/// "focus"/"blur" and "visibilitychange" when the app becomes active or not,
/// "online"/"offline" when connectivity changes (navigator.onLine follows).
/// Packages use these (TanStack Query refetches on focus and reconnect).
final class AppEvents: @unchecked Sendable {
    private var observers: [NSObjectProtocol] = []
    private let monitor = NWPathMonitor()
    private var online: Bool?

    init(send: @escaping @Sendable (String) -> Void) {
        let center = NotificationCenter.default
        #if canImport(UIKit)
        let active = UIApplication.didBecomeActiveNotification, inactive = UIApplication.willResignActiveNotification
        #else
        let active = NSApplication.didBecomeActiveNotification, inactive = NSApplication.didResignActiveNotification
        #endif
        observers = [
            center.addObserver(forName: active, object: nil, queue: nil) { _ in send("focus"); send("visibilitychange") },
            center.addObserver(forName: inactive, object: nil, queue: nil) { _ in send("blur"); send("visibilitychange") },
            // "timechange": midnight, a time zone or clock change (refresh "today").
            center.addObserver(forName: .NSCalendarDayChanged, object: nil, queue: nil) { _ in send("timechange") },
            center.addObserver(forName: .NSSystemTimeZoneDidChange, object: nil, queue: nil) { _ in send("timechange") },
            center.addObserver(forName: .NSSystemClockDidChange, object: nil, queue: nil) { _ in send("timechange") },
        ]
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self else { return }
            let isOnline = path.status == .satisfied
            // The first update is the current state, not a change.
            if let online, online != isOnline { send(isOnline ? "online" : "offline") }
            online = isOnline
        }
        monitor.start(queue: DispatchQueue(label: "SwiftJSX.network"))
    }

    deinit {
        observers.forEach(NotificationCenter.default.removeObserver)
        monitor.cancel()
    }
}
