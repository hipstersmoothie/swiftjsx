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

@MainActor
@Suite struct EnvironmentTests {
    @Test func useEnvironmentFollowsSwiftUI() async throws {
        let runtime = try fixture("Environment")
        #expect(runtime.texts() == ["compact light large 393x852 59 US 0 h12"])
        runtime.setEnvironment(["horizontalSizeClass": "regular", "colorScheme": "dark", "dynamicTypeSize": "xLarge",
                                "width": "1024", "height": "768", "safeTop": "24",
                                "locale": "de-DE", "region": "DE", "weekStartsOn": "1", "hourCycle": "h23"])
        #expect(await eventually { runtime.texts() == ["regular dark xLarge 1024x768 24 DE 1 h23"] })
    }
}

@MainActor
@Suite struct PickerTests {
    @Test func numberValuesComeBackAsNumbers() async throws {
        let runtime = try fixture("PickerValues")
        let picker = try #require(runtime.find("Picker"))
        #expect(picker.string("value") == "1")
        runtime.dispatch(picker.id, "onChange", "2", seq: 1)
        #expect(await eventually { runtime.texts() == ["size number 2"] })
    }
}

@MainActor
@Suite struct ChartTests {
    @Test func markPropsUpdate() throws {
        let runtime = try fixture("ChartUpdate")
        runtime.press("pick")
        let colors = runtime.findAll("BarMark").map { $0.string("foregroundStyle") ?? "-" }
        #expect(colors == ["pink", "orange", "pink"])
    }
}

@Suite struct PathTests {
    @Test func parsesSVGPathData() {
        #expect(SVGPath.parse("M10 10 L90 10 L90 90 Z").boundingRect == CGRect(x: 10, y: 10, width: 80, height: 80))
        // Relative commands, implicit lines after M, H/V, compact numbers.
        #expect(SVGPath.parse("m10,10 80,0v80h-80z").boundingRect == CGRect(x: 10, y: 10, width: 80, height: 80))
        #expect(SVGPath.parse("M0 0L-5-5").boundingRect == CGRect(x: -5, y: -5, width: 5, height: 5))
        #expect(SVGPath.parse("M0 0 L1e1 0").boundingRect.width == 10)
        // A half-circle arc from (0,50) to (100,50) bulges to y = 0 or 100.
        let arc = SVGPath.parse("M0 50 A50 50 0 0 1 100 50").boundingRect
        #expect(abs(arc.height - 50) < 1 && abs(arc.width - 100) < 1)
        // Smooth curves don't crash without a previous control point.
        #expect(!SVGPath.parse("M0 0 S10 10 20 0 T40 0").isEmpty)
    }

    @Test func viewBoxScalesToTheFrame() {
        let shape = PathShape(path: SVGPath.parse("M0 0 L100 50"), viewBox: CGRect(x: 0, y: 0, width: 100, height: 50), fit: false)
        #expect(shape.path(in: CGRect(x: 0, y: 0, width: 200, height: 200)).boundingRect == CGRect(x: 0, y: 0, width: 200, height: 200))
        let fitted = PathShape(path: SVGPath.parse("M0 0 L100 50"), viewBox: CGRect(x: 0, y: 0, width: 100, height: 50), fit: true)
        #expect(fitted.path(in: CGRect(x: 0, y: 0, width: 200, height: 200)).boundingRect == CGRect(x: 0, y: 50, width: 200, height: 100))
    }
}
