// Full-screen images: swipe between them, pinch or double tap to zoom (and
// drag to pan while zoomed), swipe down to dismiss. Gestures are worklets,
// so the image follows the finger on the main thread.
import { useEffect, useRef, useState } from "react";
import {
  Sheet, ScrollView, ZStack, VStack, HStack, Text, Image, Button, Spacer, ShareLink, useEnvironment,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, haptic, type HostInstance,
} from "swiftjsx";
import { useUI } from "./store";
import type { ImageView } from "./types";

export function ImageViewer() {
  const viewer = useUI((s) => s.viewer);
  const close = useUI((s) => s.closeImages);
  return (
    <Sheet item={viewer} onDismiss={close} fullScreen background="clear">
      {(v) => <Gallery images={v.images} start={v.index} onClose={close} />}
    </Sheet>
  );
}

const MAX_ZOOM = 4;

function Gallery({ images, start, onClose }: { images: ImageView[]; start: number; onClose(): void }) {
  const { window } = useEnvironment();
  const [page, setPage] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const pager = useRef<HostInstance>(null);
  // Vertical drag (to dismiss) and how dim the backdrop is.
  const drag = useSharedValue(0);
  const backdrop = useAnimatedStyle(() => ({ opacity: 1 - Math.min(Math.abs(drag.get()) / 400, 0.8) }));
  const follow = useAnimatedStyle(() => ({ offset: { x: 0, y: drag.get() }, scale: 1 - Math.min(Math.abs(drag.get()) / 2000, 0.1) }));
  const chrome = useAnimatedStyle(() => ({ opacity: 1 - Math.min(Math.abs(drag.get()) / 120, 1) }));

  useEffect(() => {
    if (start > 0) pager.current?.scrollTo(start, { animated: false });
  }, [start]);

  const dismiss = () => {
    haptic("light");
    setTimeout(onClose, 120);
  };
  const image = images[Math.min(page, images.length - 1)];

  return (
    <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} colorScheme="dark" accessibilityIdentifier="image-viewer" accessibilityElement="contain" statusBarHidden={false}>
      <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background="black" animatedStyle={backdrop} ignoresSafeArea />
      <ScrollView
        ref={pager}
        axis="horizontal"
        paging
        spacing={0}
        showsIndicators={false}
        onScrollIndexChange={(i) => {
          setPage(i);
          setZoomed(false);
        }}
        frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        animatedStyle={follow}
        ignoresSafeArea
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
      {/* Chrome: close, position, share; the alt text at the bottom. */}
      <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} animatedStyle={chrome} allowsHitTesting={!zoomed}>
        <HStack padding={{ horizontal: 12, top: 4 }}>
          <Button onPress={onClose} accessibilityLabel="Close" accessibilityIdentifier="close-viewer">
            <Image systemName="xmark" font="headline" foregroundStyle="white" frame={{ width: 38, height: 38 }} background="black/45" cornerRadius="capsule" />
          </Button>
          <Spacer />
          {images.length > 1 ? (
            <Text font="subheadline" fontWeight="semibold" foregroundStyle="white" monospacedDigit padding={{ horizontal: 12, vertical: 6 }} background="black/45" cornerRadius="capsule">
              {page + 1} of {images.length}
            </Text>
          ) : null}
          <Spacer />
          <ShareLink url={image.fullsize} accessibilityLabel="Share image">
            <Image systemName="square.and.arrow.up" font="headline" foregroundStyle="white" frame={{ width: 38, height: 38 }} background="black/45" cornerRadius="capsule" />
          </ShareLink>
        </HStack>
        <Spacer />
        {image.alt ? (
          <ScrollView frame={{ maxWidth: "infinity", maxHeight: 140 }} background={{ gradient: ["clear", "black/80"] }}>
            <Text font="subheadline" foregroundStyle="white" padding={{ horizontal: 16, vertical: 14 }} frame={{ maxWidth: "infinity", alignment: "leading" }} selectable>
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
  drag: ReturnType<typeof useSharedValue<number>>;
  onDismiss(): void;
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
          drag.set(e.translation.y);
        }
      }}
      onDragEnd={(e) => {
        "worklet";
        panStart.set({ x: 0, y: 0, active: 0 });
        if (zoom.get() > 1.01) return;
        const y = e.translation.y;
        if (Math.abs(y) > 110 || Math.abs(e.predictedEndTranslation.y) > 420) {
          drag.set(withTiming(y > 0 ? 1000 : -1000, { duration: 0.2, easing: "easeIn" }));
          runOnJS(onDismiss)();
        } else {
          drag.set(withSpring(0, { duration: 0.3, bounce: 0.25 }));
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
