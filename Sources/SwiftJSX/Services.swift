import AVFoundation
import Foundation
import UserNotifications
#if canImport(UIKit)
import UIKit
#endif

// First-party platform services for JS, like `haptic()`: local notifications,
// the app badge, text-to-speech and keeping the screen awake. No native
// backend needed. Results come back through command callbacks; ongoing
// events (a notification tapped, a word spoken) through `__swiftjsx_emit`.

/// Owns UNUserNotificationCenter's delegate (process-wide): notifications
/// show as banners while the app is open, and taps reach JS, including the
/// tap that launched the app (held until a runtime has loaded).
final class NotificationHub: NSObject, UNUserNotificationCenterDelegate, @unchecked Sendable {
    @MainActor static let shared = NotificationHub()

    /// UNUserNotificationCenter needs an app bundle (it raises in `swift test`).
    static var isAvailable: Bool { Bundle.main.bundleURL.pathExtension == "app" }

    @MainActor private var runtimes: [Weak] = []
    @MainActor private var pending: [(String, [String: Any])] = []
    private struct Weak { weak var runtime: JSXRuntime? }

    /// Become the delegate. Call as early as possible (before launch ends) so
    /// a tap that launched the app isn't missed.
    @MainActor func install() {
        guard Self.isAvailable, UNUserNotificationCenter.current().delegate !== self else { return }
        UNUserNotificationCenter.current().delegate = self
    }

    /// A runtime has loaded: send it events from now on, and any held ones.
    @MainActor func attach(_ runtime: JSXRuntime) {
        install()
        runtimes.removeAll { $0.runtime == nil || $0.runtime === runtime }
        runtimes.append(Weak(runtime: runtime))
        let held = pending
        pending = []
        for (name, payload) in held { runtime.emit(name, payload) }
    }

    @MainActor private func emit(_ name: String, _ payload: [String: Any]) {
        let live = runtimes.compactMap(\.runtime)
        if live.isEmpty { pending.append((name, payload)) }
        for runtime in live { runtime.emit(name, payload) }
    }

    static func describe(_ notification: UNNotification) -> [String: Any] {
        let content = notification.request.content
        return [
            "id": notification.request.identifier,
            "title": content.title,
            "subtitle": content.subtitle,
            "body": content.body,
            "data": content.userInfo["data"] ?? NSNull(),
        ]
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .list, .sound])
        let payload = UncheckedSendable(Self.describe(notification))
        DispatchQueue.main.async { MainActor.assumeIsolated { self.emit("notification", payload.value) } }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        var payload = Self.describe(response.notification)
        payload["action"] = response.actionIdentifier == UNNotificationDefaultActionIdentifier ? "open"
            : response.actionIdentifier == UNNotificationDismissActionIdentifier ? "dismiss" : response.actionIdentifier
        if let text = (response as? UNTextInputNotificationResponse)?.userText { payload["text"] = text }
        let sendable = UncheckedSendable(payload)
        DispatchQueue.main.async { MainActor.assumeIsolated { self.emit("notificationResponse", sendable.value) } }
        completionHandler()
    }
}

/// Notification commands from JS. `done` gets the result (on main).
@MainActor
func handleNotificationCommand(_ name: String, _ args: [String: Any], done: @escaping @MainActor (Any) -> Void) {
    guard NotificationHub.isAvailable else { return done(name == "notificationsStatus" ? "unavailable" : NSNull()) }
    let center = UNUserNotificationCenter.current()
    switch name {
    case "notificationsRequest":
        var options: UNAuthorizationOptions = [.alert, .sound, .badge]
        if args["provisional"] as? Bool == true { options.insert(.provisional) }
        center.requestAuthorization(options: options) { granted, _ in
            DispatchQueue.main.async { MainActor.assumeIsolated { done(granted) } }
        }
    case "notificationsStatus":
        center.getNotificationSettings { settings in
            let status: String = switch settings.authorizationStatus {
            case .authorized, .ephemeral: "granted"
            case .provisional: "provisional"
            case .denied: "denied"
            default: "notDetermined"
            }
            DispatchQueue.main.async { MainActor.assumeIsolated { done(status) } }
        }
    case "notificationsSchedule":
        let content = UNMutableNotificationContent()
        content.title = args["title"] as? String ?? ""
        content.subtitle = args["subtitle"] as? String ?? ""
        content.body = args["body"] as? String ?? ""
        if args["sound"] as? Bool != false { content.sound = .default }
        if let badge = args["badge"] as? NSNumber { content.badge = badge }
        if let data = args["data"], !(data is NSNull) { content.userInfo = ["data": data] }
        if let thread = args["group"] as? String { content.threadIdentifier = thread }
        if let category = args["category"] as? String { content.categoryIdentifier = category }
        if let score = (args["relevance"] as? NSNumber)?.doubleValue { content.relevanceScore = score }
        #if os(iOS)
        switch args["interruptionLevel"] as? String {
        case "passive": content.interruptionLevel = .passive
        case "timeSensitive": content.interruptionLevel = .timeSensitive
        case "critical": content.interruptionLevel = .critical
        default: break
        }
        #endif
        let repeats = args["repeats"] as? Bool ?? false
        var trigger: UNNotificationTrigger?
        if let seconds = (args["seconds"] as? NSNumber)?.doubleValue {
            trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(seconds, repeats ? 60 : 1), repeats: repeats)
        } else if let ms = (args["at"] as? NSNumber)?.doubleValue {
            let date = Date(timeIntervalSince1970: ms / 1000)
            let parts: Set<Calendar.Component> = repeats ? [.hour, .minute] : [.year, .month, .day, .hour, .minute, .second]
            trigger = UNCalendarNotificationTrigger(dateMatching: Calendar.current.dateComponents(parts, from: date), repeats: repeats)
        }
        let id = args["id"] as? String ?? UUID().uuidString
        let attachments = (args["attachments"] as? [Any] ?? []).compactMap { item -> (String, URL)? in
            let dict = item as? [String: Any]
            guard let url = ((item as? String) ?? (dict?["url"] as? String)).flatMap(URL.init(string:)) else { return nil }
            return (dict?["id"] as? String ?? UUID().uuidString, url)
        }
        let request = UncheckedSendable((content, trigger))
        Task {
            // The system takes local files only: download others first.
            request.value.0.attachments = await notificationAttachments(attachments)
            let scheduled = UNNotificationRequest(identifier: id, content: request.value.0, trigger: request.value.1)
            let added = (try? await center.add(scheduled)) != nil
            done(added ? id : NSNull())
        }
    case "notificationsCategories":
        let categories = (args["categories"] as? [[String: Any]] ?? []).map(notificationCategory)
        center.setNotificationCategories(Set(categories))
        done(NSNull())
    case "notificationsCancel":
        if let ids = args["ids"] as? [String] {
            center.removePendingNotificationRequests(withIdentifiers: ids)
            center.removeDeliveredNotifications(withIdentifiers: ids)
        } else {
            center.removeAllPendingNotificationRequests()
            center.removeAllDeliveredNotifications()
        }
        done(NSNull())
    case "notificationsPending":
        center.getPendingNotificationRequests { requests in
            let list: [[String: Any]] = requests.map { request in
                var item: [String: Any] = ["id": request.identifier, "title": request.content.title, "body": request.content.body]
                let next = (request.trigger as? UNCalendarNotificationTrigger)?.nextTriggerDate()
                    ?? (request.trigger as? UNTimeIntervalNotificationTrigger)?.nextTriggerDate()
                if let next { item["at"] = next.timeIntervalSince1970 * 1000 }
                return item
            }
            let sendable = UncheckedSendable(list)
            DispatchQueue.main.async { MainActor.assumeIsolated { done(sendable.value) } }
        }
    case "badge":
        center.setBadgeCount((args["count"] as? NSNumber)?.intValue ?? 0) { _ in
            DispatchQueue.main.async { MainActor.assumeIsolated { done(NSNull()) } }
        }
    default:
        done(NSNull())
    }
}

/// `{ id, actions: [{ id, title, destructive, foreground, authenticate,
/// systemImage, textInput: { button, placeholder } }], dismissAction }`.
private func notificationCategory(_ dict: [String: Any]) -> UNNotificationCategory {
    let actions = (dict["actions"] as? [[String: Any]] ?? []).map { action -> UNNotificationAction in
        var options: UNNotificationActionOptions = []
        if action["destructive"] as? Bool == true { options.insert(.destructive) }
        if action["foreground"] as? Bool == true { options.insert(.foreground) }
        if action["authenticate"] as? Bool == true { options.insert(.authenticationRequired) }
        let id = action["id"] as? String ?? ""
        let title = action["title"] as? String ?? id
        let icon = (action["systemImage"] as? String).map { UNNotificationActionIcon(systemImageName: $0) }
        if let input = action["textInput"] as? [String: Any] {
            return UNTextInputNotificationAction(identifier: id, title: title, options: options, icon: icon,
                                                 textInputButtonTitle: input["button"] as? String ?? "Send",
                                                 textInputPlaceholder: input["placeholder"] as? String ?? "")
        }
        return UNNotificationAction(identifier: id, title: title, options: options, icon: icon)
    }
    // Without customDismissAction, swiping one away sends no "dismiss" response.
    let options: UNNotificationCategoryOptions = dict["dismissAction"] as? Bool == true ? [.customDismissAction] : []
    return UNNotificationCategory(identifier: dict["id"] as? String ?? "", actions: actions, intentIdentifiers: [], options: options)
}

/// Images, audio or video shown with a notification. Remote URLs are
/// downloaded (the system wants files, and moves them into its own store).
private func notificationAttachments(_ items: [(String, URL)]) async -> [UNNotificationAttachment] {
    var attachments: [UNNotificationAttachment] = []
    for (id, url) in items {
        var file = url
        if !url.isFileURL {
            guard let (temporary, _) = try? await URLSession.shared.download(from: url) else { continue }
            let name = url.lastPathComponent.isEmpty ? "attachment" : url.lastPathComponent
            file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + "-" + name)
            guard (try? FileManager.default.moveItem(at: temporary, to: file)) != nil else { continue }
        }
        if let attachment = try? UNNotificationAttachment(identifier: id, url: file) { attachments.append(attachment) }
    }
    return attachments
}

/// `setKeepAwake(on)`: no auto-lock while on (cooking steps, a timer).
@MainActor
func setKeepAwake(_ on: Bool) {
    #if canImport(UIKit)
    UIApplication.shared.isIdleTimerDisabled = on
    #endif
}

/// Text-to-speech for one runtime: `speech.speak(text, options)` resolves
/// with "finished" or "cancelled"; words being spoken are emitted as
/// "speechWord" `{ id, start, length }` (UTF-16 offsets, like JS strings).
final class Speaker: NSObject, AVSpeechSynthesizerDelegate, @unchecked Sendable {
    private let synthesizer = AVSpeechSynthesizer()
    /// Utterance → (JS utterance id, command callback).
    @MainActor private var utterances: [ObjectIdentifier: (id: Int, callback: Int)] = [:]
    @MainActor private weak var runtime: JSXRuntime?

    @MainActor init(runtime: JSXRuntime) {
        self.runtime = runtime
        super.init()
        synthesizer.delegate = self
    }

    @MainActor func speak(_ args: [String: Any], callback: Int) {
        let utterance = AVSpeechUtterance(string: args["text"] as? String ?? "")
        if let rate = (args["rate"] as? NSNumber)?.floatValue {
            // 0…1 like the web's 0.1…10 squeezed: 0.5 is the default speed.
            utterance.rate = AVSpeechUtteranceMinimumSpeechRate + (AVSpeechUtteranceMaximumSpeechRate - AVSpeechUtteranceMinimumSpeechRate) * min(max(rate, 0), 1)
        }
        if let pitch = (args["pitch"] as? NSNumber)?.floatValue { utterance.pitchMultiplier = min(max(pitch, 0.5), 2) }
        if let volume = (args["volume"] as? NSNumber)?.floatValue { utterance.volume = volume }
        if let voice = args["voice"] as? String {
            utterance.voice = AVSpeechSynthesisVoice(identifier: voice) ?? AVSpeechSynthesisVoice(language: voice)
        } else if let language = args["language"] as? String {
            utterance.voice = AVSpeechSynthesisVoice(language: language)
        }
        utterances[ObjectIdentifier(utterance)] = ((args["id"] as? NSNumber)?.intValue ?? 0, callback)
        #if os(iOS)
        // Duck other audio (music keeps playing, quieter) while speaking.
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        #endif
        synthesizer.speak(utterance)
    }

    @MainActor func control(_ name: String) {
        switch name {
        case "speechStop": synthesizer.stopSpeaking(at: .immediate)
        case "speechPause": synthesizer.pauseSpeaking(at: .word)
        default: synthesizer.continueSpeaking()
        }
    }

    static func voices() -> [[String: Any]] {
        AVSpeechSynthesisVoice.speechVoices().map {
            ["id": $0.identifier, "name": $0.name, "language": $0.language, "quality": $0.quality == .premium ? "premium" : $0.quality == .enhanced ? "enhanced" : "default"]
        }
    }

    private func finish(_ utterance: AVSpeechUtterance, _ result: String) {
        let key = ObjectIdentifier(utterance)
        DispatchQueue.main.async {
            MainActor.assumeIsolated {
                guard let entry = self.utterances.removeValue(forKey: key) else { return }
                self.runtime?.resolveCommand(entry.callback, result)
                #if os(iOS)
                if self.utterances.isEmpty {
                    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
                }
                #endif
            }
        }
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) { finish(utterance, "finished") }
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) { finish(utterance, "cancelled") }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, willSpeakRangeOfSpeechString range: NSRange, utterance: AVSpeechUtterance) {
        let key = ObjectIdentifier(utterance)
        DispatchQueue.main.async {
            MainActor.assumeIsolated {
                guard let entry = self.utterances[key] else { return }
                self.runtime?.emit("speechWord", ["id": entry.id, "start": range.location, "length": range.length])
            }
        }
    }
}
