import Charts
import SwiftUI

/// `<Chart>` on Swift Charts. Children are marks (`<BarMark>`, `<LineMark>`,
/// `<AreaMark>`, `<PointMark>`, `<RuleMark>`, `<RectangleMark>`) with `x`
/// (a category string, a number, or a Date) and `y` (a number); `series`
/// groups marks into colored series (stacked bars, several lines).
struct ChartHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var numberSelection: Double?
    @State private var dateSelection: Date?
    @State private var categorySelection: String?

    var body: some View {
        let marks = node.children.filter { $0.type.hasSuffix("Mark") }
        Chart {
            ForEach(marks) { mark in
                ChartMark(node: mark)
            }
        }
        .modifier(Scales(node: node))
        .modifier(Axes(node: node))
        .modifier(SeriesColors(node: node))
        .modifier(Selection(node: node, kind: xKind(marks), number: $numberSelection, date: $dateSelection, category: $categorySelection))
        .onChange(of: numberSelection) { _, value in report(value.map { $0 as Any }) }
        .onChange(of: dateSelection) { _, value in report(value.map { $0.timeIntervalSince1970 * 1000 as Any }) }
        .onChange(of: categorySelection) { _, value in report(value.map { $0 as Any }) }
    }

    private func report(_ value: Any?) {
        guard node.has("onXSelectionChange") else { return }
        runtime?.dispatch(node.id, "onXSelectionChange", value ?? NSNull())
    }

    private func xKind(_ marks: [Node]) -> ValueKind {
        for mark in marks {
            for key in ["x", "xStart"] {
                if let kind = ValueKind(mark.prop(key)) { return kind }
            }
        }
        return .number
    }

    /// `xDomain` / `yDomain`: `[min, max]` (numbers, or Dates for x).
    private struct Scales: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            let y = node.prop("yDomain") as? [NSNumber]
            let xNumbers = (node.prop("xDomain") as? [Any])?.compactMap { $0 as? NSNumber }
            let xDates = (node.prop("xDomain") as? [Any])?.compactMap { $0 as? Date }
            content
                .modifier(Optional(y.flatMap { $0.count == 2 ? $0[0].doubleValue...$0[1].doubleValue : nil }) { c, r in c.chartYScale(domain: r) })
                .modifier(Optional(xNumbers.flatMap { $0.count == 2 ? $0[0].doubleValue...$0[1].doubleValue : nil }) { c, r in c.chartXScale(domain: r) })
                .modifier(Optional(xDates.flatMap { $0.count == 2 ? $0[0]...$0[1] : nil }) { c, r in c.chartXScale(domain: r) })
        }
    }

    /// `xAxis` / `yAxis`: "hidden", or `{ position: "leading" | "trailing" | "top" | "bottom", gridlines: false }`.
    /// `legend`: "hidden".
    private struct Axes: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            content
                .chartXAxis(node.string("xAxis") == "hidden" ? .hidden : .automatic)
                .chartYAxis(node.string("yAxis") == "hidden" ? .hidden : .automatic)
                .chartLegend(node.string("legend") == "hidden" ? .hidden : .automatic)
                .modifier(Optional(axisPosition(node.dict("yAxis")?["position"] as? String)) { c, position in
                    c.chartYAxis { AxisMarks(position: position) }
                })
        }

        private func axisPosition(_ name: String?) -> AxisMarkPosition? {
            switch name {
            case "leading": .leading
            case "trailing": .trailing
            case "top": .top
            case "bottom": .bottom
            default: nil
            }
        }
    }

    /// `seriesColors`: `{ seriesName: color }`.
    private struct SeriesColors: ViewModifier {
        let node: Node
        func body(content: Content) -> some View {
            if let map = node.dict("seriesColors"), !map.isEmpty {
                let names = map.keys.sorted()
                content.chartForegroundStyleScale(domain: names, range: names.map { color(map[$0]) ?? .gray })
            } else {
                content
            }
        }
    }

    /// `onXSelectionChange`: scrubbing selects the x value under the finger.
    private struct Selection: ViewModifier {
        let node: Node
        let kind: ValueKind
        @Binding var number: Double?
        @Binding var date: Date?
        @Binding var category: String?

        func body(content: Content) -> some View {
            if !node.has("onXSelectionChange") {
                content
            } else {
                switch kind {
                case .number: content.chartXSelection(value: $number)
                case .date: content.chartXSelection(value: $date)
                case .category: content.chartXSelection(value: $category)
                }
            }
        }
    }
}

/// What kind of value an `x` is: category, number or date.
enum ValueKind {
    case number, date, category
    init?(_ value: Any?) {
        switch value {
        case is String: self = .category
        case is Date: self = .date
        case is NSNumber: self = .number
        default: return nil
        }
    }
}

/// One mark. Swift Charts needs concrete value types, so each mark is built
/// for its `x` kind.
private struct ChartMark: ChartContent {
    let node: Node

    var body: some ChartContent {
        switch ValueKind(node.prop("x") ?? node.prop("xStart")) {
        case .category: styled(content(for: node.string("x") ?? "", start: node.string("xStart"), end: node.string("xEnd")))
        case .date: styled(content(for: node.prop("x") as? Date ?? .distantPast, start: node.prop("xStart") as? Date, end: node.prop("xEnd") as? Date))
        default: styled(content(for: node.double("x") ?? 0, start: node.double("xStart"), end: node.double("xEnd")))
        }
    }

    private var y: Double { node.double("y") ?? 0 }

    @ChartContentBuilder
    private func content<X: Plottable>(for x: X, start: X?, end: X?) -> some ChartContent {
        let label = node.string("xLabel") ?? "x"
        let yLabel = node.string("yLabel") ?? "y"
        switch node.type {
        case "LineMark":
            LineMark(x: .value(label, x), y: .value(yLabel, y), series: .value("Series", node.string("series") ?? ""))
                .interpolationMethod(interpolation)
        case "AreaMark":
            if let low = node.double("yStart"), let high = node.double("yEnd") {
                AreaMark(x: .value(label, x), yStart: .value(yLabel, low), yEnd: .value(yLabel, high), series: .value("Series", node.string("series") ?? ""))
                    .interpolationMethod(interpolation)
            } else {
                AreaMark(x: .value(label, x), y: .value(yLabel, y), stacking: stacking)
                    .interpolationMethod(interpolation)
            }
        case "PointMark":
            PointMark(x: .value(label, x), y: .value(yLabel, y))
                .symbolSize(node.double("symbolSize") ?? 30)
        case "RuleMark":
            if node.has("y") {
                RuleMark(y: .value(yLabel, y))
            } else {
                RuleMark(x: .value(label, x))
            }
        case "RectangleMark":
            if let start, let end {
                RectangleMark(xStart: .value(label, start), xEnd: .value(label, end),
                              yStart: .value(yLabel, node.double("yStart") ?? 0), yEnd: .value(yLabel, node.double("yEnd") ?? 1))
            } else {
                RectangleMark(x: .value(label, x), y: .value(yLabel, y))
            }
        default: // BarMark
            if let low = node.double("yStart"), let high = node.double("yEnd") {
                BarMark(x: .value(label, x), yStart: .value(yLabel, low), yEnd: .value(yLabel, high), width: barWidth)
                    .cornerRadius(node.cgFloat("cornerRadius") ?? 0)
            } else {
                BarMark(x: .value(label, x), y: .value(yLabel, y), width: barWidth, stacking: stacking)
                    .cornerRadius(node.cgFloat("cornerRadius") ?? 0)
            }
        }
    }

    /// Color (or a `series` category colored by the chart's `seriesColors`),
    /// line style, opacity, annotation.
    @ChartContentBuilder
    private func styled<C: ChartContent>(_ mark: C) -> some ChartContent {
        let line = StrokeStyle(lineWidth: node.cgFloat("lineWidth") ?? 2,
                               lineCap: .round, lineJoin: .round,
                               dash: (node.prop("dash") as? [Any])?.compactMap { ($0 as? NSNumber).map { CGFloat($0.doubleValue) } } ?? [])
        let annotated = mark
            .lineStyle(line)
            .opacity(node.double("opacity") ?? 1)
            .annotation(position: annotationPosition, alignment: .center) {
                if let text = node.string("annotation") {
                    Text(text).font(.caption).foregroundStyle(.secondary)
                }
            }
        if let style = fill(node.prop("foregroundStyle")) {
            annotated.foregroundStyle(style)
        } else if let series = node.string("series") {
            annotated.foregroundStyle(by: .value("Series", series))
        } else {
            annotated
        }
    }

    private var interpolation: InterpolationMethod {
        switch node.string("interpolation") {
        case "catmullRom": .catmullRom
        case "monotone": .monotone
        case "stepStart": .stepStart
        case "stepCenter": .stepCenter
        case "stepEnd": .stepEnd
        case "cardinal": .cardinal
        default: .linear
        }
    }

    private var stacking: MarkStackingMethod {
        switch node.string("stacking") {
        case "normalized": .normalized
        case "center": .center
        case "unstacked": .unstacked
        default: .standard
        }
    }

    private var barWidth: MarkDimension {
        if let width = node.cgFloat("barWidth") { return .fixed(width) }
        if let ratio = node.cgFloat("barWidthRatio") { return .ratio(ratio) }
        return .automatic
    }

    private var annotationPosition: AnnotationPosition {
        switch node.string("annotationPosition") {
        case "bottom": .bottom
        case "leading": .leading
        case "trailing": .trailing
        case "overlay": .overlay
        default: .top
        }
    }
}

/// Applies `transform` when `value` is non-nil.
private struct Optional<Value>: ViewModifier {
    let value: Value?
    let transform: (Content, Value) -> AnyView

    init<V: View>(_ value: Value?, _ transform: @escaping (Content, Value) -> V) {
        self.value = value
        self.transform = { AnyView(transform($0, $1)) }
    }

    func body(content: Content) -> some View {
        if let value { transform(content, value) } else { content }
    }
}
