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
struct VideoHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var player = AVPlayer()
    @State private var observer: Any?
    @State private var endObserver: NSObjectProtocol?

    var body: some View {
        Group {
            if node.has("controls"), !node.bool("controls") {
                PlayerLayer(player: player, fill: node.string("contentMode") == "fill")
            } else {
                VideoPlayer(player: player)
            }
        }
        .onChange(of: node.string("src"), initial: true) { _, src in load(src) }
        .onChange(of: node.bool("paused")) { _, paused in paused ? player.pause() : player.play() }
        .onChange(of: node.bool("muted"), initial: true) { _, muted in player.isMuted = muted }
        .onDisappear { player.pause() }
    }

    private func load(_ src: String?) {
        guard let url = src.flatMap(URL.init(string:)) else { return }
        let item = AVPlayerItem(url: url)
        player.replaceCurrentItem(with: item)
        if let observer { player.removeTimeObserver(observer) }
        observer = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.5, preferredTimescale: 600), queue: .main) { [node, runtime, player] time in
            MainActor.assumeIsolated {
                guard node.has("onTimeUpdate") else { return }
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
        if node.bool("autoPlay"), !node.bool("paused") { player.play() }
    }
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
/// Children: `<Marker latitude longitude title tint systemImage>` and
/// `<MapAnnotation latitude longitude title>` (any views, centered on the
/// coordinate).
struct MapHost: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var position: MapCameraPosition = .automatic

    var body: some View {
        MapReader { proxy in
            Map(position: $position) {
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
    }

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

    private static func coordinate(_ node: Node) -> CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: node.double("latitude") ?? 0, longitude: node.double("longitude") ?? 0)
    }
}
