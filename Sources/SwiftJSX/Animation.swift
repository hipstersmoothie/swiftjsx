import SwiftUI

/// An animation spec from JS: a name (`"spring"`, `"bouncy"`, `"snappy"`,
/// `"smooth"`, `"easeInOut"`, `"easeIn"`, `"easeOut"`, `"linear"`,
/// `"default"`) or an object `{ type, duration?, bounce?, delay?, speed?,
/// repeatCount?, autoreverses? }` with one of those types.
func parseAnimation(_ value: Any?) -> Animation? {
    switch value {
    case let name as String:
        return namedAnimation(name, duration: nil, bounce: nil)
    case let spec as [String: Any]:
        func number(_ key: String) -> Double? { (spec[key] as? NSNumber)?.doubleValue }
        var animation = namedAnimation(spec["type"] as? String ?? "default", duration: number("duration"), bounce: number("bounce"))
        if let speed = number("speed") { animation = animation.speed(speed) }
        if let count = number("repeatCount") {
            animation = animation.repeatCount(Int(count), autoreverses: spec["autoreverses"] as? Bool ?? true)
        } else if spec["repeatForever"] as? Bool == true {
            animation = animation.repeatForever(autoreverses: spec["autoreverses"] as? Bool ?? true)
        }
        // After repeating, so a looping animation waits once (staggered dots)
        // rather than before every cycle.
        if let delay = number("delay") { animation = animation.delay(delay) }
        return animation
    default:
        return nil
    }
}

private func namedAnimation(_ name: String, duration: Double?, bounce: Double?) -> Animation {
    switch name {
    case "spring": .spring(duration: duration ?? 0.5, bounce: bounce ?? 0)
    case "bouncy": .bouncy(duration: duration ?? 0.5, extraBounce: bounce ?? 0)
    case "snappy": .snappy(duration: duration ?? 0.5, extraBounce: bounce ?? 0)
    case "smooth": .smooth(duration: duration ?? 0.5, extraBounce: bounce ?? 0)
    case "easeInOut": .easeInOut(duration: duration ?? 0.35)
    case "easeIn": .easeIn(duration: duration ?? 0.35)
    case "easeOut": .easeOut(duration: duration ?? 0.35)
    case "linear": .linear(duration: duration ?? 0.35)
    default: duration.map { .spring(duration: $0) } ?? .default
    }
}
