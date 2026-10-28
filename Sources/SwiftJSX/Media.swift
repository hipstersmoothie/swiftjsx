import AVKit
import MapKit
import SwiftUI
import WebKit

// Video (AVKit), web pages (WebKit) and maps (MapKit).

// MARK: - Video

/// `<Video src>`: `autoPlay`, `paused` (controlled), `muted`, `loop`,
/// `controls` (false: just the picture, e.g. a looping background),
/// `contentMode` ("fit" | "fill"); `onReady({ duration })`,
/// `onTimeUpdate({ currentTime, duration })` (about twice a second), `onEnd`.
/// `playsWhenVisible`: plays only while at least half of it is on screen
/// (feeds render rows ahead of the scroll position). `poster`: an image URL
/// shown until it starts playing.
struct VideoHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var player = AVPlayer()
    @State private var observer: Any?
    @State private var endObserver: NSObjectProtocol?
    @State private var visible = false
    @State private var started = false

    var body: some View {
        Group {
            if node.has("controls"), !node.bool("controls") {
                PlayerLayer(player: player, fill: node.string("contentMode") == "fill")
            } else {
                VideoPlayer(player: player)
            }
        }
        .overlay {
            if !started, let poster = node.string("poster").flatMap(URL.init(string:)) {
                PosterImage(url: poster, fill: node.string("contentMode") == "fill")
                    .allowsHitTesting(false)
            }
        }
        .onScrollVisibilityChange(threshold: 0.5) { isVisible in
            visible = isVisible
            guard node.bool("playsWhenVisible") else { return }
            if isVisible, shouldPlay { player.play() } else if !isVisible { player.pause() }
        }
        .onChange(of: node.string("src"), initial: true) { _, src in load(src) }
        .onChange(of: node.bool("paused")) { _, paused in paused || !visibleEnough ? player.pause() : player.play() }
        .onChange(of: node.bool("muted"), initial: true) { _, muted in player.isMuted = muted }
        .onDisappear { player.pause() }
    }

    private func load(_ src: String?) {
        guard let url = src.flatMap(URL.init(string:)) else { return }
        let item = AVPlayerItem(url: url)
        player.replaceCurrentItem(with: item)
        if let observer { player.removeTimeObserver(observer) }
        // The observer also fires while paused (at load, after seeks): report
        // only times that moved.
        let last = LastTime()
        started = false
        let begun = $started
        observer = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.5, preferredTimescale: 600), queue: .main) { [node, runtime, player] time in
            MainActor.assumeIsolated {
                if time.seconds > 0, !begun.wrappedValue { begun.wrappedValue = true }
                guard node.has("onTimeUpdate"), time.seconds != last.seconds else { return }
                last.seconds = time.seconds
                let duration = player.currentItem?.duration.seconds ?? .nan
                runtime?.dispatch(node.id, "onTimeUpdate", ["currentTime": time.seconds, "duration": duration.isFinite ? duration : 0])
            }
        }
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        endObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { [node, runtime, player] _ in
            MainActor.assumeIsolated {
                if node.bool("loop") {
                    player.seek(to: .zero)
                    player.play()
                }
                if node.has("onEnd") { runtime?.dispatch(node.id, "onEnd") }
            }
        }
        Task { [node, runtime] in
            let duration = (try? await item.asset.load(.duration))?.seconds ?? 0
            if node.has("onReady") { runtime?.dispatch(node.id, "onReady", ["duration": duration.isFinite ? duration : 0]) }
        }
        if shouldPlay { player.play() }
    }

    /// autoPlay, not paused, and on screen if it has to be.
    private var shouldPlay: Bool { node.bool("autoPlay") && !node.bool("paused") && visibleEnough }
    private var visibleEnough: Bool { !node.bool("playsWhenVisible") || visible }
}

/// A video's `poster`, from the shared image cache.
private struct PosterImage: View {
    let url: URL
    let fill: Bool
    @State private var image: PlatformImage?

    var body: some View {
        ZStack {
            if let image = image ?? ImageLoader.shared.cached(url) {
                if fill {
                    Color.clear.overlay { platformImage(image).resizable().scaledToFill() }.clipped()
                } else {
                    platformImage(image).resizable().scaledToFit()
                }
            }
        }
        .task(id: url) { image = try? await ImageLoader.shared.load(url) }
    }
}

private final class LastTime: @unchecked Sendable {
    var seconds: Double = 0
}

#if os(iOS)
/// The picture alone (no controls).
private struct PlayerLayer: UIViewRepresentable {
    let player: AVPlayer
    let fill: Bool
    func makeUIView(context: Context) -> LayerView { LayerView() }
    func updateUIView(_ view: LayerView, context: Context) {
        view.playerLayer.player = player
        view.playerLayer.videoGravity = fill ? .resizeAspectFill : .resizeAspect
    }
    final class LayerView: UIView {
        override class var layerClass: AnyClass { AVPlayerLayer.self }
        var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
    }
}
#else
private struct PlayerLayer: NSViewRepresentable {
    let player: AVPlayer
    let fill: Bool
    func makeNSView(context: Context) -> AVPlayerView {
        let view = AVPlayerView()
        view.controlsStyle = .none
        return view
    }
    func updateNSView(_ view: AVPlayerView, context: Context) {
        view.player = player
        view.videoGravity = fill ? .resizeAspectFill : .resizeAspect
    }
}
#endif

// MARK: - Web view

/// `<WebView url | html>`: `onLoad({ url, title })`, `onError(message)`,
/// `onMessage(data)` (the page calls
/// `window.webkit.messageHandlers.swiftjsx.postMessage(data)`),
/// `injectedJavaScript` (run when each page loads), `scrollEnabled`.
@MainActor
struct WebViewHost {
    let node: Node
    let runtime: JSXRuntime?

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var host: WebViewHost
        var loaded: String?
        init(_ host: WebViewHost) { self.host = host }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            MainActor.assumeIsolated {
                if let script = host.node.string("injectedJavaScript") { webView.evaluateJavaScript(script) }
                guard host.node.has("onLoad") else { return }
                host.runtime?.dispatch(host.node.id, "onLoad", ["url": webView.url?.absoluteString ?? "", "title": webView.title ?? ""])
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { report(error) }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { report(error) }

        private func report(_ error: Error) {
            let message = error.localizedDescription
            MainActor.assumeIsolated {
                if host.node.has("onError") { host.runtime?.dispatch(host.node.id, "onError", message) }
            }
        }

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            let body = message.body
            MainActor.assumeIsolated {
                if host.node.has("onMessage") { host.runtime?.dispatch(host.node.id, "onMessage", body) }
            }
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func make(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(context.coordinator, name: "swiftjsx")
        #if os(iOS)
        configuration.allowsInlineMediaPlayback = true
        #endif
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.isInspectable = true
        return view
    }

    func update(_ view: WKWebView, context: Context) {
        context.coordinator.host = self
        #if os(iOS)
        view.scrollView.isScrollEnabled = !node.has("scrollEnabled") || node.bool("scrollEnabled")
        #endif
        // Load only when the source changes.
        let source = node.string("url") ?? node.string("html").map { "html:" + $0 }
        guard source != context.coordinator.loaded, let source else { return }
        context.coordinator.loaded = source
        if let url = node.string("url").flatMap(URL.init(string:)) {
            view.load(URLRequest(url: url))
        } else if let html = node.string("html") {
            view.loadHTMLString(html, baseURL: node.string("baseURL").flatMap(URL.init(string:)))
        }
    }

    typealias Context = PlatformContext
}

#if os(iOS)
extension WebViewHost: UIViewRepresentable {
    typealias PlatformContext = UIViewRepresentableContext<WebViewHost>
    func makeUIView(context: Context) -> WKWebView { make(context: context) }
    func updateUIView(_ view: WKWebView, context: Context) { update(view, context: context) }
}
#else
extension WebViewHost: NSViewRepresentable {
    typealias PlatformContext = NSViewRepresentableContext<WebViewHost>
    func makeNSView(context: Context) -> WKWebView { make(context: context) }
    func updateNSView(_ view: WKWebView, context: Context) { update(view, context: context) }
}
#endif

// MARK: - Map

/// `<Map region>`: `region` is `{ latitude, longitude, latitudeDelta,
/// longitudeDelta }` (moves the camera when it changes);
/// `onRegionChange(region)` when the user stops moving it; `onPress({
/// latitude, longitude })`; `mapStyle` ("standard" | "imagery" | "hybrid").
/// Children: `<Marker latitude longitude title tint systemImage>`,
/// `<MapAnnotation latitude longitude title>` (any views, centered on the
/// coordinate), and overlays: `<MapPolyline coordinates>`,
/// `<MapPolygon coordinates>`, `<MapCircle latitude longitude radius>`
/// (`stroke`, `lineWidth`, `fill`). `showsUserLocation` (asks for
/// when-in-use permission), `followsUserLocation`, `controls`.
struct MapHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var position: MapCameraPosition = .automatic

    var body: some View {
        MapReader { proxy in
            Map(position: $position) {
                if node.bool("showsUserLocation") { UserAnnotation() }
                ForEach(node.children.filter { Self.overlayTypes.contains($0.type) }) { overlay in
                    MapOverlay(node: overlay)
                }
                ForEach(node.children.filter { $0.type == "Marker" }) { marker in
                    let coordinate = Self.coordinate(marker)
                    let title = marker.string("title") ?? ""
                    if let icon = marker.string("systemImage") {
                        Marker(title, systemImage: icon, coordinate: coordinate).tint(color(marker.prop("tint")) ?? .red)
                    } else {
                        Marker(title, coordinate: coordinate).tint(color(marker.prop("tint")) ?? .red)
                    }
                }
                ForEach(node.children.filter { $0.type == "MapAnnotation" }) { annotation in
                    Annotation(annotation.string("title") ?? "", coordinate: Self.coordinate(annotation)) {
                        ZStack { Children(node: annotation) }
                    }
                }
            }
            .mapStyle(style)
            .mapControls { MapControlsHost(names: node.prop("controls") as? [String] ?? []) }
            .onMapCameraChange(frequency: .onEnd) { context in
                guard node.has("onRegionChange") else { return }
                let region = context.region
                runtime?.dispatch(node.id, "onRegionChange", [
                    "latitude": region.center.latitude, "longitude": region.center.longitude,
                    "latitudeDelta": region.span.latitudeDelta, "longitudeDelta": region.span.longitudeDelta,
                ])
            }
            .onTapGesture(coordinateSpace: .local) { point in
                guard node.has("onPress"), let coordinate = proxy.convert(point, from: .local) else { return }
                runtime?.dispatch(node.id, "onPress", ["latitude": coordinate.latitude, "longitude": coordinate.longitude])
            }
        }
        .onChange(of: regionKey, initial: true) { _, _ in
            if let region { withAnimation { position = .region(region) } }
        }
        .onChange(of: node.bool("followsUserLocation"), initial: true) { _, follow in
            if follow { withAnimation { position = .userLocation(fallback: position) } }
        }
        .onChange(of: node.bool("showsUserLocation") || node.bool("followsUserLocation"), initial: true) { _, wanted in
            if wanted { LocationPermission.requestWhenInUse() }
        }
    }

    static let overlayTypes: Set<String> = ["MapPolyline", "MapPolygon", "MapCircle"]

    private var region: MKCoordinateRegion? {
        guard let dict = node.dict("region"), let lat = dict["latitude"] as? NSNumber, let lon = dict["longitude"] as? NSNumber else { return nil }
        let latDelta = (dict["latitudeDelta"] as? NSNumber)?.doubleValue ?? 0.05
        let lonDelta = (dict["longitudeDelta"] as? NSNumber)?.doubleValue ?? latDelta
        return MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: lat.doubleValue, longitude: lon.doubleValue),
                                  span: MKCoordinateSpan(latitudeDelta: latDelta, longitudeDelta: lonDelta))
    }

    /// Changes to `region` (compared by value).
    private var regionKey: [Double] {
        guard let r = region else { return [] }
        return [r.center.latitude, r.center.longitude, r.span.latitudeDelta, r.span.longitudeDelta]
    }

    private var style: MapStyle {
        switch node.string("mapStyle") {
        case "imagery": .imagery
        case "hybrid": .hybrid
        default: .standard
        }
    }

    static func coordinate(_ node: Node) -> CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: node.double("latitude") ?? 0, longitude: node.double("longitude") ?? 0)
    }

    static func coordinates(_ value: Any?) -> [CLLocationCoordinate2D] {
        (value as? [Any] ?? []).compactMap { item in
            if let dict = item as? [String: Any], let lat = dict["latitude"] as? NSNumber, let lon = dict["longitude"] as? NSNumber {
                return CLLocationCoordinate2D(latitude: lat.doubleValue, longitude: lon.doubleValue)
            }
            // [latitude, longitude] pairs (GeoJSON is [longitude, latitude]: swap first).
            if let pair = item as? [NSNumber], pair.count == 2 {
                return CLLocationCoordinate2D(latitude: pair[0].doubleValue, longitude: pair[1].doubleValue)
            }
            return nil
        }
    }
}

/// A line, shape or circle drawn on the map.
private struct MapOverlay: MapContent {
    let node: Node

    var body: some MapContent {
        let stroke = color(node.prop("stroke")) ?? .blue
        let width = node.cgFloat("lineWidth") ?? 3
        let fill = color(node.prop("fill")) ?? .clear
        switch node.type {
        case "MapPolygon":
            MapPolygon(coordinates: MapHost.coordinates(node.prop("coordinates")))
                .foregroundStyle(fill)
                .stroke(stroke, lineWidth: width)
        case "MapCircle":
            MapCircle(center: MapHost.coordinate(node), radius: node.double("radius") ?? 100)
                .foregroundStyle(fill)
                .stroke(stroke, lineWidth: width)
        default:
            MapPolyline(coordinates: MapHost.coordinates(node.prop("coordinates")))
                .stroke(stroke, style: StrokeStyle(lineWidth: width, lineCap: .round, lineJoin: .round))
        }
    }
}

/// `controls={["userLocation", "compass", "scale", "pitchToggle"]}`.
private struct MapControlsHost: View {
    let names: [String]
    var body: some View {
        if names.contains("userLocation") { MapUserLocationButton() }
        if names.contains("compass") { MapCompass() }
        if names.contains("scale") { MapScaleView() }
        if names.contains("pitchToggle") { MapPitchToggle() }
    }
}

/// When-in-use location permission (asked once; the system remembers).
@MainActor
enum LocationPermission {
    private static let manager = CLLocationManager()

    static func requestWhenInUse() {
        guard manager.authorizationStatus == .notDetermined else { return }
        guard Bundle.main.object(forInfoDictionaryKey: "NSLocationWhenInUseUsageDescription") != nil else {
            print("[SwiftJSX] Location needs NSLocationWhenInUseUsageDescription in the app's Info.plist.")
            return
        }
        manager.requestWhenInUseAuthorization()
    }
}
