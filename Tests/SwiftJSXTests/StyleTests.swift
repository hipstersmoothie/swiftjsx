import SwiftUI
import Testing
@testable import SwiftJSX

@MainActor
@Suite struct StyleTests {
    private func rgba(_ c: Color?) -> [Double]? {
        guard let resolved = c?.resolve(in: EnvironmentValues()) else { return nil }
        return [resolved.red, resolved.green, resolved.blue, resolved.opacity].map { (Double($0) * 100).rounded() / 100 }
    }

    @Test func colors() {
        #expect(rgba(color("#ff0000")) == [1, 0, 0, 1])
        #expect(rgba(color("#ff000080"))?[3] == 0.5)
        #expect(rgba(color("white/20")) == [1, 1, 1, 0.2])
        #expect(rgba(color("#00ff00/50")) == [0, 1, 0, 0.5])
        #expect(color("systemBackground") != nil)
        #expect(color("secondaryLabel/40") != nil)
        #expect(color("nope") == nil)

        var dark = EnvironmentValues()
        dark.colorScheme = .dark
        let pair = color(["light": "#000000", "dark": "#ffffff"] as [String: Any])
        #expect(pair?.resolve(in: dark).red == 1)
        #expect(rgba(pair) == [0, 0, 0, 1])
    }

    @Test func fills() {
        #expect(fill("secondary") != nil)
        #expect(fill("thinMaterial") != nil)
        #expect(fill(["gradient": ["red", ["color": "blue", "location": 0.8]], "type": "radial"] as [String: Any]) != nil)
        #expect(fill(["light": "red", "dark": "blue"] as [String: Any]) != nil)
        #expect(fill(42) == nil)
    }

    @Test func fonts() {
        #expect(font("headline") == .headline)
        #expect(font(["size": 96, "weight": "thin"] as [String: Any]) == .system(size: 96, weight: .thin))
        #expect(font(["name": "Georgia", "size": 20, "relativeTo": "title3"] as [String: Any]) == .custom("Georgia", size: 20, relativeTo: .title3))
        #expect(font("huge") == nil)
    }

    @Test func corners() {
        #expect(Corners(12).radii.topLeading == 12)
        #expect(Corners("capsule").capsule)
        let bubble = Corners(["topLeading": 18, "bottomTrailing": 4] as [String: Any])
        #expect(bubble.radii.topLeading == 18 && bubble.radii.bottomTrailing == 4 && bubble.radii.topTrailing == 0)
        #expect(Corners(nil).isSquare)
        let rect = CGRect(x: 0, y: 0, width: 100, height: 40)
        // No radius: the clip is unbounded, so overflow and shadows show.
        #expect(BoxShape(corners: Corners(0), unbounded: true).path(in: rect).boundingRect.width > 1000)
        #expect(BoxShape(corners: Corners(0)).path(in: rect).boundingRect == rect)
    }
}
