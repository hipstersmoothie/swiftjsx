import SwiftUI
#if canImport(UIKit)
import UIKit
typealias PlatformImage = UIImage
#else
import AppKit
typealias PlatformImage = NSImage
#endif

/// `<Image src="https://…">`: loads through `ImageLoader` (memory cache,
/// de-duplicated requests, decoded off the main thread), shows a placeholder
/// meanwhile, and fades the image in. `onLoad` / `onError` fire once per
/// `src`, like on the web, even when a lazy container re-creates the view.
///
/// `contentMode="fill"` covers whatever size the view is given and clips
/// (CSS `object-fit: cover`); "fit" (default) letterboxes.
struct RemoteImage: View {
    let node: Node
    @Environment(\.jsxRuntime) private var runtime
    @State private var loaded: (url: URL, image: PlatformImage)?
    @State private var failed: URL?

    var body: some View {
        let url = node.string("src").flatMap(URL.init(string:))
        // Cache hits render on the first frame, with no placeholder flash.
        let image = url.flatMap { url in loaded?.url == url ? loaded?.image : ImageLoader.shared.cached(url) }
        ZStack {
            if let image {
                if node.string("contentMode") == "fill" {
                    Color.clear
                        .overlay { platformImage(image).resizable().scaledToFill() }
                        .clipped()
                } else {
                    platformImage(image).resizable().scaledToFit()
                }
            } else if url != nil, failed == url {
                Image(systemName: "photo")
                    .foregroundStyle(.secondary)
            } else {
                Color.secondary.opacity(0.12)
            }
        }
        .animation(.easeOut(duration: 0.2), value: loaded?.url)
        .task(id: url) {
            guard let url else { return }
            do {
                let image = try await ImageLoader.shared.load(url)
                if loaded?.url != url { loaded = (url, image) }
                failed = nil
                report(url, "onLoad", ["width": image.size.width, "height": image.size.height])
            } catch is CancellationError {
            } catch {
                failed = url
                report(url, "onError", ["message": error.localizedDescription])
            }
        }
    }

    private func report(_ url: URL, _ event: String, _ payload: [String: Any]) {
        guard node.reportedImageURL != url else { return }
        node.reportedImageURL = url
        runtime?.dispatch(node.id, event, payload)
    }

    private func platformImage(_ image: PlatformImage) -> Image {
        #if canImport(UIKit)
        Image(uiImage: image)
        #else
        Image(nsImage: image)
        #endif
    }
}

/// Shared image cache for `<Image src>`.
final class ImageLoader: @unchecked Sendable {
    static let shared = ImageLoader()

    private let cache = NSCache<NSURL, PlatformImage>()
    private let lock = NSLock()
    private var inFlight: [URL: Task<PlatformImage, Error>] = [:]

    init() {
        cache.totalCostLimit = 100 * 1024 * 1024
    }

    func cached(_ url: URL) -> PlatformImage? {
        cache.object(forKey: url as NSURL)
    }

    func load(_ url: URL) async throws -> PlatformImage {
        if let image = cached(url) { return image }
        let task = lock.withLock {
            if let task = inFlight[url] { return task }
            let task = Task.detached(priority: .userInitiated) { [cache] in
                let (data, response) = try await URLSession.shared.data(from: url)
                if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                    throw URLError(.badServerResponse)
                }
                guard let image = PlatformImage(data: data) else { throw URLError(.cannotDecodeContentData) }
                #if canImport(UIKit)
                // Decode now, off the main thread, instead of on first draw.
                let ready = await image.byPreparingForDisplay() ?? image
                let pixels = ready.size.width * ready.size.height * ready.scale * ready.scale
                #else
                let ready = image
                let pixels = ready.size.width * ready.size.height
                #endif
                cache.setObject(ready, forKey: url as NSURL, cost: Int(pixels) * 4)
                return ready
            }
            inFlight[url] = task
            return task
        }
        defer { lock.withLock { inFlight[url] = nil } }
        return try await task.value
    }
}
