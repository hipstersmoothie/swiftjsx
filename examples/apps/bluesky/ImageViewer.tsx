// Bluesky's lightbox: the tapped thumbnail zooms out into a black, full-screen
// viewer (and back into the thumbnail when it closes). Swipe between images,
// pinch or double tap to zoom (drag to pan while zoomed), swipe down to
// dismiss: the image follows the finger, shrinking as it goes, and the black
// fades. It draws in a full-screen Portal (above the tab bar, like a cover),
// and the gestures are worklets so the image follows the finger on the main
// thread.
import { useEffect, useRef, useState } from "react";
import {
  Portal, AbsoluteStack, ScrollView, ZStack, VStack, HStack, Text, Image, Button, Spacer, ShareLink, useEnvironment,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withAnimation, runOnJS, haptic, type HostInstance, type Frame,
} from "swiftjsx";
import { useUI, type Corners } from "./store";
import { ty } from "./theme";
import type { ImageView } from "./types";

export function ImageViewer() {
  const viewer = useUI((s) => s.viewer);
  const close = useUI((s) => s.closeImages);
  if (!viewer) return null;
  return (
    <Portal interactive fullScreen>
      <Gallery key={viewer.id} images={viewer.images} start={viewer.index} origin={viewer.origin} radius={viewer.radius} onClose={close} />
    </Portal>
  );
}

const MAX_ZOOM = 4;
/** How far a swipe-down drag shrinks the image (at most), and over how many points the black fades out. */
const SHRINK = 0.35;
const FADE = 320;

/** The image's scale for a dismiss drag of `dy` points. */
function shrink(dy: number) {
  "worklet";
  return 1 - Math.min(Math.abs(dy) / 900, SHRINK);
}
const ZOOM = { type: "smooth", duration: 0.36 } as const;

/** Where an image of this aspect ratio sits when fitted to the screen. */
function fitted(image: ImageView, width: number, height: number): Frame {
  const ratio = image.aspectRatio ? image.aspectRatio.width / image.aspectRatio.height : 1;
  let w = width;
  let h = width / ratio;
  if (h > height) {
    h = height;
    w = height * ratio;
  }
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

type Phase = "opening" | "open" | "closing";

function Gallery({ images, start, origin, radius, onClose }: { images: ImageView[]; start: number; origin: Frame | null; radius: Corners; onClose(): void }) {
  const { window, safeAreaInsets } = useEnvironment();
  const [page, setPage] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  // The flying image's frame: the thumbnail's, then the fitted one (and back when closing).
  const [phase, setPhase] = useState<Phase>("opening");
  const [flight, setFlight] = useState<{ frame: Frame; radius: Corners | number; dim: number } | null>(
    origin ? { frame: origin, radius, dim: 0 } : null,
  );
  const pager = useRef<HostInstance>(null);
  const screen = { width: window.width, height: window.height };
  // The dismiss drag: the image follows the finger and shrinks; the black fades.
  const drag = useSharedValue({ x: 0, y: 0 });
  const backdrop = useAnimatedStyle(() => ({ opacity: 1 - Math.min(Math.abs(drag.get().y) / FADE, 1) }));
  const follow = useAnimatedStyle(() => ({ offset: drag.get(), scale: shrink(drag.get().y) }));
  const chrome = useAnimatedStyle(() => ({ opacity: 1 - Math.min(Math.abs(drag.get().y) / 100, 1) }));
  const image = images[Math.min(page, images.length - 1)];

  useEffect(() => {
    if (start > 0) pager.current?.scrollTo(start, { animated: false });
    // Zoom out of the thumbnail on the next turn (after the first frame drew it in place).
    const timer = setTimeout(() => {
      if (!origin) {
        withAnimation({ type: "easeOut", duration: 0.2 }, () => setPhase("open"));
        return;
      }
      withAnimation(
        ZOOM,
        () => setFlight({ frame: fitted(images[start], screen.width, screen.height), radius: 0, dim: 1 }),
        () => {
          setPhase("open");
          setFlight(null);
        },
      );
    }, 16);
    return () => clearTimeout(timer);
    // Once, when the viewer opens.
  }, []);

  /** Back into the thumbnail when we're still on it; otherwise fade away. `dx`, `dy` are where a swipe left the image. */
  const dismiss = (dx = 0, dy = 0) => {
    haptic("light");
    if (origin && page === start) {
      // Where the dragged image is now: fitted, shrunk around its center, moved by the finger.
      const fit = fitted(images[start], screen.width, screen.height);
      const s = shrink(dy);
      const from = { x: fit.x + (fit.width * (1 - s)) / 2 + dx, y: fit.y + (fit.height * (1 - s)) / 2 + dy, width: fit.width * s, height: fit.height * s };
      setFlight({ frame: from, radius: 0, dim: 1 - Math.min(Math.abs(dy) / FADE, 1) });
      setPhase("closing");
      setTimeout(() => withAnimation(ZOOM, () => setFlight({ frame: origin, radius, dim: 0 }), onClose), 16);
    } else {
      withAnimation({ type: "easeIn", duration: 0.18 }, () => setPhase("closing"), onClose);
    }
  };

  const open = phase === "open";
  const dim = flight ? flight.dim : open ? 1 : 0;

  return (
    <ZStack alignment="top" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} accessibilityIdentifier="image-viewer" accessibilityElement="contain">
      <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background="black" opacity={dim} animatedStyle={open ? backdrop : undefined} />
      <VStack frame={{ width: window.width, height: window.height }} opacity={open ? 1 : 0}>
        <ScrollView
          ref={pager}
          axis="horizontal"
          paging
          // Zoomed in, a horizontal drag pans the image instead of paging.
          scrollEnabled={!zoomed}
          spacing={0}
          showsIndicators={false}
          onScrollIndexChange={(i) => {
            setPage(i);
            setZoomed(false);
          }}
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          animatedStyle={follow}
        >
          {images.map((img, i) => (
            <ZoomableImage
              key={img.fullsize}
              image={img}
              width={window.width}
              active={i === page}
              zoomed={zoomed && i === page}
              onZoomChange={setZoomed}
              drag={drag}
              onDismiss={dismiss}
            />
          ))}
        </ScrollView>
      </VStack>
      {flight ? (
        <AbsoluteStack frame={{ width: window.width, height: window.height }} allowsHitTesting={false}>
          <Image src={images[start].thumb} contentMode="fill" position={flight.frame} cornerRadius={flight.radius} placeholder="none" />
        </AbsoluteStack>
      ) : null}
      {/* Chrome: close, position, share; the alt text at the bottom. */}
      <VStack
        frame={{ width: window.width, height: window.height }}
        padding={{ top: safeAreaInsets.top, bottom: safeAreaInsets.bottom }}
        opacity={open ? 1 : 0}
        animatedStyle={open ? chrome : undefined}
        allowsHitTesting={open && !zoomed}
      >
        <HStack padding={{ horizontal: 14, top: 6 }}>
          <Button onPress={() => dismiss()} accessibilityLabel="Close" accessibilityIdentifier="close-viewer" pressedOpacity={0.6}>
            <Image systemName="xmark" font={{ size: 17, weight: "semibold" }} foregroundStyle="white" frame={{ width: 36, height: 36 }} background="white/18" cornerRadius="capsule" />
          </Button>
          <Spacer />
          {images.length > 1 ? (
            <Text font={ty(15, "semibold")} foregroundStyle="white" monospacedDigit accessibilityIdentifier="viewer-counter">
              {page + 1} of {images.length}
            </Text>
          ) : null}
          <Spacer />
          <ShareLink url={image.fullsize} accessibilityLabel="Share image">
            <Image systemName="square.and.arrow.up" font={{ size: 16, weight: "semibold" }} foregroundStyle="white" frame={{ width: 36, height: 36 }} background="white/18" cornerRadius="capsule" offset={{ y: -1 }} />
          </ShareLink>
        </HStack>
        <Spacer />
        {image.alt ? (
          <ScrollView frame={{ maxWidth: "infinity", maxHeight: 160 }} background={{ gradient: ["clear", "black/85"] }}>
            <Text font={ty(15)} foregroundStyle="white" lineSpacing={3} padding={{ horizontal: 18, top: 24, bottom: 14 }} frame={{ maxWidth: "infinity", alignment: "leading" }} selectable accessibilityIdentifier="viewer-alt">
              {image.alt}
            </Text>
          </ScrollView>
        ) : null}
      </VStack>
    </ZStack>
  );
}

type ZoomProps = {
  image: ImageView;
  width: number;
  active: boolean;
  zoomed: boolean;
  onZoomChange(zoomed: boolean): void;
  drag: ReturnType<typeof useSharedValue<{ x: number; y: number }>>;
  onDismiss(dx: number, dy: number): void;
};

function ZoomableImage({ image, width, active, zoomed, onZoomChange, drag, onDismiss }: ZoomProps) {
  const zoom = useSharedValue(1);
  const pinchStart = useSharedValue(0);
  const pan = useSharedValue({ x: 0, y: 0 });
  const panStart = useSharedValue({ x: 0, y: 0, active: 0 });
  const style = useAnimatedStyle(() => ({ scale: zoom.get(), offset: pan.get() }));

  // Leaving the page resets its zoom.
  useEffect(() => {
    if (!active) {
      zoom.set(1);
      pan.set({ x: 0, y: 0 });
    }
  }, [active, zoom, pan]);

  const ratio = image.aspectRatio ? image.aspectRatio.width / image.aspectRatio.height : 1;

  return (
    <ZStack
      frame={{ width, maxHeight: "infinity" }}
      contentShape="rectangle"
      // Not zoomed: only vertical drags are ours (horizontal ones page). Zoomed: any drag pans.
      dragAxis={zoomed ? undefined : "vertical"}
      onDrag={(e) => {
        "worklet";
        if (zoom.get() > 1.01) {
          if (!panStart.get().active) panStart.set({ x: pan.get().x, y: pan.get().y, active: 1 });
          const s = panStart.get();
          pan.set({ x: s.x + e.translation.x, y: s.y + e.translation.y });
        } else {
          drag.set({ x: e.translation.x, y: e.translation.y });
        }
      }}
      onDragEnd={(e) => {
        "worklet";
        panStart.set({ x: 0, y: 0, active: 0 });
        if (zoom.get() > 1.01) return;
        const { x, y } = e.translation;
        if (Math.abs(y) > 110 || Math.abs(e.predictedEndTranslation.y) > 420) {
          // The flying image takes over from where the finger left it.
          runOnJS(onDismiss)(x, y);
          drag.set(withTiming({ x: 0, y: 0 }, { duration: 0.01 }));
        } else {
          drag.set(withSpring({ x: 0, y: 0 }, { duration: 0.3, bounce: 0.2 }));
        }
      }}
      onMagnify={(e) => {
        "worklet";
        if (pinchStart.get() === 0) pinchStart.set(zoom.get());
        zoom.set(Math.min(MAX_ZOOM, Math.max(0.8, pinchStart.get() * e.scale)));
      }}
      onMagnifyEnd={() => {
        "worklet";
        pinchStart.set(0);
        if (zoom.get() <= 1) {
          zoom.set(withSpring(1, { duration: 0.3 }));
          pan.set(withSpring({ x: 0, y: 0 }, { duration: 0.3 }));
          runOnJS(onZoomChange)(false);
        } else {
          runOnJS(onZoomChange)(true);
        }
      }}
      onDoubleTap={() => {
        "worklet";
        const zoomIn = zoom.get() < 1.5;
        zoom.set(withSpring(zoomIn ? 2.5 : 1, { duration: 0.35, bounce: 0.15 }));
        pan.set(withSpring({ x: 0, y: 0 }, { duration: 0.35 }));
        runOnJS(onZoomChange)(zoomIn);
      }}
      accessibilityLabel={image.alt || "Image"}
      accessibilityHint="Pinch or double tap to zoom; swipe down to close"
      accessibilityTraits="image"
    >
      <Image src={image.fullsize} contentMode="fit" frame={{ maxWidth: width, maxHeight: "infinity" }} aspectRatio={ratio} animatedStyle={style} placeholder="none">
        <Image src={image.thumb} contentMode="fit" frame={{ maxWidth: width, maxHeight: "infinity" }} aspectRatio={ratio} placeholder="none" />
      </Image>
    </ZStack>
  );
}
