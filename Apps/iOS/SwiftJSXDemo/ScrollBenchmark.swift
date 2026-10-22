import SwiftJSX
import UIKit

/// Scroll benchmark for list screens. Enabled with SWIFTJSX_SCROLL_BENCH=1
/// (simctl: SIMCTL_CHILD_…, devicectl: DEVICECTL_CHILD_…). Finds the tallest
/// scroll view on screen and scrolls it at constant speeds with a display link,
/// like a finger would, then prints a report ("BENCH …" lines).
@MainActor
final class ScrollBenchmark {
    static func startIfRequested() {
        guard ProcessInfo.processInfo.environment["SWIFTJSX_SCROLL_BENCH"] != nil else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { ScrollBenchmark().run() }
    }

    private struct Phase { let name: String; let speed: CGFloat; let seconds: Double }
    private let phases = [
        Phase(name: "steady 2000 pt/s", speed: 2000, seconds: 4),
        Phase(name: "fling 6000 pt/s", speed: 6000, seconds: 4),
    ]

    private var scrollView: UIScrollView!
    private var link: CADisplayLink?
    private var phaseIndex = 0
    private var phaseStart: CFTimeInterval = 0
    private var last: CFTimeInterval = 0
    private var frames: [(interval: Double, expected: Double, blank: Int, visible: Int, at: Double, commits: Int)] = []
    private var lastCommits = 0

    private func run() {
        let windows = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap(\.windows)
        let scrollViews = windows.flatMap { Self.scrollViews(in: $0) }
        guard let target = scrollViews.max(by: { $0.contentSize.height < $1.contentSize.height }) else {
            print("BENCH error: no scroll view found")
            return
        }
        scrollView = target
        print("BENCH scroll view \(type(of: target)), content height \(Int(target.contentSize.height)) pt, max \(UIScreen.main.maximumFramesPerSecond) fps")
        startPhase()
    }

    private static func scrollViews(in view: UIView) -> [UIScrollView] {
        (view as? UIScrollView).map { [$0] } ?? [] + view.subviews.flatMap { scrollViews(in: $0) }
    }

    /// SWIFTJSX_SCROLL_BENCH=here: scroll from wherever the screen put us
    /// (e.g. after a JS-driven scrollTo) instead of from the top.
    private let fromHere = ProcessInfo.processInfo.environment["SWIFTJSX_SCROLL_BENCH"] == "here"
    private var contentHeights: [CGFloat] = []

    private func startPhase() {
        // Jump to the top, then let React render that window before measuring:
        // the jump itself isn't scrolling.
        if !fromHere {
            scrollView.setContentOffset(CGPoint(x: 0, y: -scrollView.adjustedContentInset.top), animated: false)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { self.startMeasuring() }
    }

    private func startMeasuring() {
        frames = []
        contentHeights = [scrollView.contentSize.height]
        SwiftJSXDiagnostics.reset()
        lastCommits = 0
        print(String(format: "BENCH   start offset %.0f pt (row ≈ %.0f), visible slots %d, rendered rows %d",
                     scrollView.contentOffset.y, scrollView.contentOffset.y / 56, SwiftJSXDiagnostics.visibleRows,
                     SwiftJSXDiagnostics.renderedRows))
        let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
        let fps = Float(UIScreen.main.maximumFramesPerSecond)
        link.preferredFrameRateRange = CAFrameRateRange(minimum: fps, maximum: fps, preferred: fps)
        link.add(to: .main, forMode: .common)
        self.link = link
        phaseStart = 0
    }

    @objc private func tick(_ link: CADisplayLink) {
        let phase = phases[phaseIndex]
        if phaseStart == 0 {
            phaseStart = link.timestamp
            last = link.timestamp
            return
        }
        let interval = link.timestamp - last
        last = link.timestamp
        frames.append((interval, link.targetTimestamp - link.timestamp,
                       SwiftJSXDiagnostics.blankVisibleRows, SwiftJSXDiagnostics.visibleRows,
                       link.timestamp - phaseStart, SwiftJSXDiagnostics.commits - lastCommits))
        lastCommits = SwiftJSXDiagnostics.commits

        if contentHeights.last != scrollView.contentSize.height { contentHeights.append(scrollView.contentSize.height) }
        var offset = scrollView.contentOffset
        offset.y += phase.speed * CGFloat(interval)
        scrollView.setContentOffset(offset, animated: false)

        if link.timestamp - phaseStart >= phase.seconds {
            link.invalidate()
            report(phase)
            phaseIndex += 1
            if phaseIndex < phases.count {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) { self.startPhase() }
            } else {
                print("BENCH DONE")
            }
        }
    }

    private func report(_ phase: Phase) {
        let expected = frames.map(\.expected).sorted()[frames.count / 2]   // median frame budget
        let duration = frames.map(\.interval).reduce(0, +)
        // Hitch time: time beyond the budget in frames that ran late (Apple's "hitch time ratio").
        let hitchTime = frames.map { max(0, $0.interval - expected * 1.5 > 0 ? $0.interval - expected : 0) }.reduce(0, +)
        let hitches = frames.filter { $0.interval > expected * 1.5 }.count
        let worst = frames.map(\.interval).max() ?? 0
        let blankFrames = frames.filter { $0.blank > 0 }.count
        let maxBlank = frames.map(\.blank).max() ?? 0
        print(String(format: "BENCH %@: %d frames in %.1f s (%.0f fps avg, budget %.1f ms)", phase.name, frames.count, duration,
                     Double(frames.count) / duration, expected * 1000))
        print(String(format: "BENCH   hitches: %d (%.0f ms/s hitch time), worst frame %.1f ms", hitches, hitchTime * 1000 / duration, worst * 1000))
        print(String(format: "BENCH   blank rows: on %.0f%% of frames, up to %d of ~%d visible", 100 * Double(blankFrames) / Double(frames.count),
                     maxBlank, frames.map(\.visible).max() ?? 0))
        print("BENCH   list body evaluations: \(SwiftJSXDiagnostics.virtualListBodies), commits: \(SwiftJSXDiagnostics.commits), ops: \(SwiftJSXDiagnostics.ops)")
        print(String(format: "BENCH   max visible slots %d; content height changed %d times (%.0f → %.0f pt); rendered rows now %d",
                     frames.map(\.visible).max() ?? 0, contentHeights.count - 1, contentHeights.first ?? 0, contentHeights.last ?? 0,
                     SwiftJSXDiagnostics.renderedRows))
        let late = frames.filter { $0.interval > expected * 1.5 }
        if !late.isEmpty {
            print("BENCH   late frames: " + late.map { String(format: "%.0fms@%.2fs(%d commits)", $0.interval * 1000, $0.at, $0.commits) }.joined(separator: " "))
        }
    }
}
