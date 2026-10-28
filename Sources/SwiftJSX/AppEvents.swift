import Foundation
import Network
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// Fires the browser's window events in JS from the app's lifecycle:
/// "focus"/"blur" and "visibilitychange" when the app becomes active or not,
/// "pagehide" / "pageshow" when it goes to the background and comes back
/// (with background time for last-chance saves in pagehide handlers),
/// "online"/"offline" when connectivity changes (navigator.onLine follows).
/// Packages use these (TanStack Query refetches on focus and reconnect).
final class AppEvents: @unchecked Sendable {
    private var observers: [NSObjectProtocol] = []
    private let monitor = NWPathMonitor()
    private var online: Bool?

    /// `afterJS(done)` calls `done` once JS has run what's queued before it.
    init(send: @escaping @Sendable (String) -> Void, afterJS: @escaping @Sendable (@escaping @Sendable () -> Void) -> Void = { $0() }) {
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
        #if canImport(UIKit)
        observers += [
            center.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { _ in
                MainActor.assumeIsolated {
                    // Time for pagehide handlers (and saves they start) before suspension.
                    let task = BackgroundTime(name: "swiftjsx.pagehide")
                    send("pagehide")
                    afterJS {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { MainActor.assumeIsolated { task.end() } }
                    }
                }
            },
            center.addObserver(forName: UIApplication.willEnterForegroundNotification, object: nil, queue: nil) { _ in send("pageshow") },
        ]
        #endif
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

#if canImport(UIKit)
/// A UIKit background task, ended once (by us, or when time runs out).
@MainActor
final class BackgroundTime: Sendable {
    private var task = UIBackgroundTaskIdentifier.invalid

    init(name: String) {
        task = UIApplication.shared.beginBackgroundTask(withName: name) { [weak self] in
            MainActor.assumeIsolated { self?.end() }
        }
    }

    func end() {
        guard task != .invalid else { return }
        UIApplication.shared.endBackgroundTask(task)
        task = .invalid
    }
}
#endif
