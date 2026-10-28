import Charts
import SwiftUI

/// `<Chart>` on Swift Charts. Children are marks (`<BarMark>`, `<LineMark>`,
/// `<AreaMark>`, `<PointMark>`, `<RuleMark>`, `<RectangleMark>`) with `x`
/// (a category string, a number, or a Date) and `y` (a number); `series`
/// groups marks into colored series (stacked bars, several lines).
struct ChartHost: View {
    let node: Node

    var body: some View {
        let marks = node.children.filter { $0.type.hasSuffix("Mark") }
        // Charts builds marks outside this body, out of Observation's sight:
        // read their props here (so a change re-runs this body) and hand them
        // over as values (Charts skips marks whose inputs look unchanged, and a
        // Node reference never changes).
        let props = marks.map(\.props)
        Chart {
            ForEach(Array(marks.enumerated()), id: \.element.id) { index, mark in
                ChartMark(node: mark, props: props[index])
            }
        }
        .modifier(Scales(node: node))
        .modifier(Axes(node: node, xKind: xKind(marks)))
        .modifier(SeriesColors(node: node))
        .modifier(Selections(node: node, kind: xKind(marks)))
        .modifier(Scrolling(node: node, kind: xKind(marks)))
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

    /// `xAxis` / `yAxis`: "hidden", or `{ position, values, stride, count,
    /// format, gridlines, ticks, labels }` (see `ChartAxis` in components.ts).
    /// `legend`: "hidden".
    private struct Axes: ViewModifier {
        let node: Node
        let xKind: ValueKind

        func body(content: Content) -> some View {
            content
                .chartLegend(node.string("legend") == "hidden" ? .hidden : .automatic)
                .modifier(AxisModifier(spec: node.prop("xAxis"), vertical: false, kind: xKind))
                .modifier(AxisModifier(spec: node.prop("yAxis"), vertical: true, kind: .number))
        }
    }

    private struct AxisModifier: ViewModifier {
        let spec: Any?
        let vertical: Bool
        let kind: ValueKind

        func body(content: Content) -> some View {
            if spec as? String == "hidden" {
                if vertical { content.chartYAxis(.hidden) } else { content.chartXAxis(.hidden) }
            } else if let axis = spec as? [String: Any] {
                if vertical {
                    content.chartYAxis { marks(axis) }
                } else {
                    content.chartXAxis { marks(axis) }
                }
            } else {
                content
            }
        }

        @AxisContentBuilder
        private func marks(_ axis: [String: Any]) -> some AxisContent {
            let position = position(axis["position"] as? String)
            if let list = axis["values"] as? [Any] {
                // Explicit values: numbers, Dates or categories.
                switch kind {
                case .date: AxisMarks(position: position, values: list.compactMap { $0 as? Date }) { mark($0, axis) }
                case .category: AxisMarks(position: position, values: list.compactMap { $0 as? String }) { mark($0, axis) }
                case .number: AxisMarks(position: position, values: list.compactMap { ($0 as? NSNumber)?.doubleValue }) { mark($0, axis) }
                }
            } else {
                AxisMarks(position: position, values: values(axis)) { mark($0, axis) }
            }
        }

        @AxisMarkBuilder
        private func mark(_ value: AxisValue, _ axis: [String: Any]) -> some AxisMark {
            if axis["gridlines"] as? Bool ?? true { AxisGridLine() }
            if axis["ticks"] as? Bool ?? true { AxisTick() }
            if axis["labels"] as? Bool ?? true {
                if let format = axis["format"] as? String {
                    AxisValueLabel { Text(axisLabel(value, format: format, kind: kind)) }
                } else {
                    AxisValueLabel()
                }
            }
        }

        /// `stride` (a number, or `{ unit, count }` for dates), or `count`
        /// (about how many).
        private func values(_ axis: [String: Any]) -> AxisMarkValues {
            if let step = (axis["stride"] as? NSNumber)?.doubleValue { return .stride(by: step) }
            if let stride = axis["stride"] as? [String: Any], let unit = calendarUnit(stride["unit"] as? String) {
                return .stride(by: unit, count: (stride["count"] as? NSNumber)?.intValue ?? 1)
            }
            if let count = (axis["count"] as? NSNumber)?.intValue { return .automatic(desiredCount: count) }
            return .automatic
        }

        private func position(_ name: String?) -> AxisMarkPosition {
            switch name {
            case "leading": .leading
            case "trailing": .trailing
            case "top": .top
            case "bottom": .bottom
            default: .automatic
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

    /// `onXSelectionChange`: scrubbing selects the x value under the finger;
    /// `onYSelectionChange` the y value; `onXRangeSelectionChange` a span.
    private struct Selections: ViewModifier {
        let node: Node
        let kind: ValueKind
        @Environment(\.jsxRuntime) private var runtime
        @State private var number: Double?
        @State private var date: Date?
        @State private var category: String?
        @State private var y: Double?
        @State private var numberRange: ClosedRange<Double>?
        @State private var dateRange: ClosedRange<Date>?

        func body(content: Content) -> some View {
            content
                .modifier(XSelection(node: node, kind: kind, number: $number, date: $date, category: $category))
                .onChange(of: number) { _, value in report("onXSelectionChange", value) }
                .onChange(of: date) { _, value in report("onXSelectionChange", value.map { $0.timeIntervalSince1970 * 1000 }) }
                .onChange(of: category) { _, value in report("onXSelectionChange", value) }
                .modifier(YSelection(node: node, value: $y))
                .onChange(of: y) { _, value in report("onYSelectionChange", value) }
                .modifier(RangeSelection(node: node, kind: kind, number: $numberRange, date: $dateRange))
                .onChange(of: numberRange) { _, range in report("onXRangeSelectionChange", range.map { [$0.lowerBound, $0.upperBound] }) }
                .onChange(of: dateRange) { _, range in
                    report("onXRangeSelectionChange", range.map { [$0.lowerBound.timeIntervalSince1970 * 1000, $0.upperBound.timeIntervalSince1970 * 1000] })
                }
        }

        private func report(_ event: String, _ value: Any?) {
            if node.has(event) { runtime?.dispatch(node.id, event, value ?? NSNull()) }
        }
    }

    private struct XSelection: ViewModifier {
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

/// `onYSelectionChange`: the y value under the finger.
private struct YSelection: ViewModifier {
    let node: Node
    @Binding var value: Double?
    func body(content: Content) -> some View {
        if node.has("onYSelectionChange") { content.chartYSelection(value: $value) } else { content }
    }
}

/// `onXRangeSelectionChange([start, end] | null)`: on iOS, two fingers (or
/// a drag after a hold) select a span of x (numbers or dates).
private struct RangeSelection: ViewModifier {
    let node: Node
    let kind: ValueKind
    @Binding var number: ClosedRange<Double>?
    @Binding var date: ClosedRange<Date>?
    func body(content: Content) -> some View {
        if !node.has("onXRangeSelectionChange") {
            content
        } else {
            switch kind {
            case .number: content.chartXSelection(range: $number)
            case .date: content.chartXSelection(range: $date)
            case .category: content
            }
        }
    }
}

/// `xVisibleDomain`: a scrolling chart showing this much x at a time
/// (numbers; for dates, seconds or `{ unit, count }`; for categories, how
/// many). `xScrollPosition` is where it starts (the leading edge's x);
/// `onXScrollPositionChange` reports it while scrolling; `xScrollAlignment`
/// snaps to a number or a calendar unit ("day", "week", "month") when the
/// finger lifts.
private struct Scrolling: ViewModifier {
    let node: Node
    let kind: ValueKind
    @Environment(\.jsxRuntime) private var runtime
    @State private var number: Double
    @State private var date: Date
    @State private var category: String

    init(node: Node, kind: ValueKind) {
        self.node = node
        self.kind = kind
        let start = node.prop("xScrollPosition")
        _number = State(initialValue: (start as? NSNumber)?.doubleValue ?? -Double.greatestFiniteMagnitude)
        _date = State(initialValue: start as? Date ?? .distantPast)
        _category = State(initialValue: start as? String ?? "")
    }

    func body(content: Content) -> some View {
        if let length = node.prop("xVisibleDomain") {
            switch kind {
            case .number:
                content
                    .chartScrollableAxes(.horizontal)
                    .chartXVisibleDomain(length: (length as? NSNumber)?.doubleValue ?? 10)
                    .chartScrollPosition(x: $number)
                    .modifier(Optional(node.double("xScrollAlignment")) { c, unit in c.chartScrollTargetBehavior(.valueAligned(unit: unit)) })
                    .onChange(of: number) { _, x in report(x) }
            case .date:
                content
                    .chartScrollableAxes(.horizontal)
                    .chartXVisibleDomain(length: Self.seconds(length))
                    .chartScrollPosition(x: $date)
                    .modifier(Optional(Self.alignment(node.string("xScrollAlignment"))) { c, match in
                        c.chartScrollTargetBehavior(.valueAligned(matching: match, majorAlignment: .matching(match)))
                    })
                    .onChange(of: date) { _, x in report(x.timeIntervalSince1970 * 1000) }
            case .category:
                content
                    .chartScrollableAxes(.horizontal)
                    .chartXVisibleDomain(length: (length as? NSNumber)?.intValue ?? 5)
                    .chartScrollPosition(x: $category)
                    .onChange(of: category) { _, x in report(x) }
            }
        } else {
            content
        }
    }

    private func report(_ x: Any) {
        if node.has("onXScrollPositionChange") { runtime?.dispatch(node.id, "onXScrollPositionChange", x) }
    }

    private static func seconds(_ length: Any) -> Double {
        if let n = length as? NSNumber { return n.doubleValue }
        let spec = length as? [String: Any]
        let count = (spec?["count"] as? NSNumber)?.doubleValue ?? 1
        let unit: Double = switch spec?["unit"] as? String {
        case "minute": 60
        case "hour": 3600
        case "week", "weekOfYear": 7 * 86400
        case "month": 30.44 * 86400
        case "quarter": 91.31 * 86400
        case "year": 365.25 * 86400
        default: 86400
        }
        return count * unit
    }

    /// The date components a snapped position matches.
    private static func alignment(_ unit: String?) -> DateComponents? {
        switch unit {
        case "hour": DateComponents(minute: 0)
        case "day": DateComponents(hour: 0)
        case "week", "weekOfYear": DateComponents(hour: 0, weekday: Calendar.current.firstWeekday)
        case "month": DateComponents(day: 1, hour: 0)
        case "year": DateComponents(month: 1, day: 1, hour: 0)
        default: nil
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
    let props: [String: Any]

    var body: some ChartContent {
        let label = node.string("xLabel") ?? "x"
        switch ValueKind(node.prop("x") ?? node.prop("xStart")) {
        case .category:
            styled(content(for: node.string("x") ?? "", start: node.string("xStart"), end: node.string("xEnd")) { .value(label, $0) })
        case .date:
            // `xUnit`: the Date stands for a whole day / week / month (bars span it).
            let unit = calendarUnit(node.string("xUnit"))
            styled(content(for: node.prop("x") as? Date ?? .distantPast, start: node.prop("xStart") as? Date, end: node.prop("xEnd") as? Date) { date in
                if let unit { .value(label, date, unit: unit) } else { .value(label, date) }
            })
        default:
            styled(content(for: node.double("x") ?? 0, start: node.double("xStart"), end: node.double("xEnd")) { .value(label, $0) })
        }
    }

    private var y: Double { node.double("y") ?? 0 }

    @ChartContentBuilder
    private func content<X: Plottable>(for x: X, start: X?, end: X?, _ value: (X) -> PlottableValue<X>) -> some ChartContent {
        let yLabel = node.string("yLabel") ?? "y"
        switch node.type {
        case "LineMark":
            LineMark(x: value(x), y: .value(yLabel, y), series: .value("Series", node.string("series") ?? ""))
                .interpolationMethod(interpolation)
        case "AreaMark":
            if let low = node.double("yStart"), let high = node.double("yEnd") {
                AreaMark(x: value(x), yStart: .value(yLabel, low), yEnd: .value(yLabel, high), series: .value("Series", node.string("series") ?? ""))
                    .interpolationMethod(interpolation)
            } else {
                AreaMark(x: value(x), y: .value(yLabel, y), stacking: stacking)
                    .interpolationMethod(interpolation)
            }
        case "PointMark":
            PointMark(x: value(x), y: .value(yLabel, y))
                .symbolSize(node.double("symbolSize") ?? 30)
        case "RuleMark":
            if node.has("y") {
                RuleMark(y: .value(yLabel, y))
            } else {
                RuleMark(x: value(x))
            }
        case "RectangleMark":
            if let start, let end {
                RectangleMark(xStart: value(start), xEnd: value(end),
                              yStart: .value(yLabel, node.double("yStart") ?? 0), yEnd: .value(yLabel, node.double("yEnd") ?? 1))
            } else {
                RectangleMark(x: value(x), y: .value(yLabel, y))
            }
        default: // BarMark
            if let low = node.double("yStart"), let high = node.double("yEnd") {
                BarMark(x: value(x), yStart: .value(yLabel, low), yEnd: .value(yLabel, high), width: barWidth)
            } else {
                BarMark(x: value(x), y: .value(yLabel, y), width: barWidth, stacking: stacking)
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
            .cornerRadius(node.cgFloat("cornerRadius") ?? 0)
            .lineStyle(line)
            .opacity(node.double("opacity") ?? 1)
            .annotation(position: annotationPosition, alignment: .center) {
                if let text = node.string("annotation") {
                    Text(text).font(.caption).foregroundStyle(.secondary)
                }
            }
        if let plain = color(node.prop("foregroundStyle")) {
            // A Color, not an AnyShapeStyle: Charts can't animate between
            // type-erased styles and kept the old color under an `animation`.
            annotated.foregroundStyle(plain)
        } else if let style = fill(node.prop("foregroundStyle")) {
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

func calendarUnit(_ name: String?) -> Calendar.Component? {
    switch name {
    case "minute": .minute
    case "hour": .hour
    case "day": .day
    case "weekOfYear", "week": .weekOfYear
    case "month": .month
    case "quarter": .quarter
    case "year": .year
    default: nil
    }
}

/// An axis label in a `format`. Numbers: "integer", "decimal", "percent"
/// (0.5 → 50%), "compact" (1.2K), "currency:USD"; with "+" as prefix
/// (`"+integer"`) for signs. Dates: "weekday", "weekdayNarrow", "day",
/// "month", "monthNarrow", "monthDay", "hour", "time", "year".
/// Anything else is a template string with "{}" for the value ("{} km").
func axisLabel(_ value: AxisValue, format: String, kind: ValueKind) -> String {
    // By the axis's kind: `as(Date.self)` also turns plain numbers into Dates.
    switch kind {
    case .date: value.as(Date.self).map { formatDate($0, format) } ?? ""
    case .number: value.as(Double.self).map { formatNumber($0, format) } ?? ""
    case .category: value.as(String.self) ?? ""
    }
}

private func formatDate(_ date: Date, _ format: String) -> String {
    switch format {
    case "weekday": date.formatted(.dateTime.weekday(.abbreviated))
    case "weekdayNarrow": date.formatted(.dateTime.weekday(.narrow))
    case "day": date.formatted(.dateTime.day())
    case "month": date.formatted(.dateTime.month(.abbreviated))
    case "monthNarrow": date.formatted(.dateTime.month(.narrow))
    case "monthDay": date.formatted(.dateTime.month(.abbreviated).day())
    case "hour": date.formatted(.dateTime.hour())
    case "time": date.formatted(date: .omitted, time: .shortened)
    case "year": date.formatted(.dateTime.year())
    default: date.formatted(date: .abbreviated, time: .omitted)
    }
}

private func formatNumber(_ number: Double, _ format: String) -> String {
    let signed = format.hasPrefix("+")
    let name = signed ? String(format.dropFirst()) : format
    let sign: NumberFormatStyleConfiguration.SignDisplayStrategy = signed ? .always(includingZero: false) : .automatic
    switch name {
    case "integer": return number.formatted(.number.precision(.fractionLength(0)).sign(strategy: sign))
    case "decimal": return number.formatted(.number.precision(.fractionLength(0...2)).sign(strategy: sign))
    case "percent": return number.formatted(.percent.precision(.fractionLength(0)).sign(strategy: sign))
    case "compact": return number.formatted(.number.notation(.compactName).sign(strategy: sign))
    default:
        if name.hasPrefix("currency:") {
            return number.formatted(.currency(code: String(name.dropFirst(9))).precision(.fractionLength(0)))
        }
        if name.contains("{}") {
            return name.replacingOccurrences(of: "{}", with: number.formatted(.number.precision(.fractionLength(0...1))))
        }
        return number.formatted()
    }
}
