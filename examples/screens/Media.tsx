import { useState } from "react";
import {
  Screen, ScrollView, VStack, HStack, Text, Button, Video, WebView, MapView, Marker, MapAnnotation, MapPolyline, MapCircle, Image, Toggle,
  useGeolocation, NativeView, native, isNativeAvailable, type MapRegion,
} from "swiftjsx";

const VIDEO = "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8";
const PAGE = `<!doctype html><meta name="viewport" content="width=device-width">
<body style="font: 17px -apple-system; padding: 12px">
  <p>A web page. Its button talks to React:</p>
  <button onclick="window.webkit.messageHandlers.swiftjsx.postMessage({ clicked: Date.now() })">Send a message</button>
</body>`;
const PARK: MapRegion = { latitude: 37.3349, longitude: -122.009, latitudeDelta: 0.02 };
// A walk from Infinite Loop to Apple Park.
const WALK: [number, number][] = [
  [37.3318, -122.0312], [37.3323, -122.0262], [37.3327, -122.0202], [37.3331, -122.0151], [37.3349, -122.0128], [37.3349, -122.009],
];

export function MediaDemo() {
  const [paused, setPaused] = useState(true);
  const [video, setVideo] = useState("loading…");
  const [message, setMessage] = useState("none yet");
  const [loaded, setLoaded] = useState("");
  const [region, setRegion] = useState(PARK);
  const [center, setCenter] = useState("");
  const [locate, setLocate] = useState(false);
  const { position, error } = useGeolocation({ enabled: locate });

  return (
    <Screen title="Media" titleDisplayMode="inline">
      <ScrollView>
        <VStack alignment="leading" spacing={14} padding={20}>
          <Text font="headline">Video</Text>
          <Video
            src={VIDEO}
            paused={paused}
            muted
            frame={{ height: 200 }}
            cornerRadius={12}
            onReady={({ duration }) => setVideo(`ready, ${Math.round(duration)} s`)}
            onTimeUpdate={({ currentTime }) => setVideo(`playing ${currentTime.toFixed(1)} s`)}
          />
          <HStack>
            <Button title={paused ? "Play" : "Pause"} buttonStyle="bordered" onPress={() => setPaused((p) => !p)} />
            {/* A UIKit view from the native backend: the AirPlay picker. */}
            {isNativeAvailable() && (
              <NativeView
                create={() => {
                  const picker = native.AVRoutePickerView.new();
                  picker.activeTintColor = native.UIColor.systemBlueColor;
                  return picker;
                }}
                frame={{ width: 36, height: 36 }}
                accessibilityIdentifier="route-picker"
              />
            )}
            <Text font="footnote" monospacedDigit foregroundStyle="secondary" accessibilityIdentifier="video-status">{video}</Text>
          </HStack>

          <Text font="headline">Web view</Text>
          <WebView html={PAGE} frame={{ height: 120 }} cornerRadius={12} onLoad={() => setLoaded("loaded")} onMessage={(data) => setMessage(JSON.stringify(data).slice(0, 40))} accessibilityIdentifier="web" />
          <Text font="footnote" foregroundStyle="secondary" accessibilityIdentifier="web-message">{`${loaded} · message: ${message}`}</Text>

          <Text font="headline">Map</Text>
          <MapView
            region={region}
            onRegionChange={(r) => setCenter(`${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)}`)}
            onPress={(c) => setRegion({ ...c, latitudeDelta: 0.02 })}
            frame={{ height: 240 }}
            cornerRadius={12}
            showsUserLocation={locate}
            controls={["compass", "scale", ...(locate ? (["userLocation"] as const) : [])]}
            accessibilityIdentifier="map"
          >
            <MapPolyline coordinates={WALK} stroke="indigo" lineWidth={4} />
            <MapCircle latitude={37.3349} longitude={-122.009} radius={350} fill="green/15" stroke="green" lineWidth={1} />
            <Marker latitude={37.3349} longitude={-122.009} title="Apple Park" systemImage="apple.logo" tint="gray" />
            <MapAnnotation latitude={37.3318} longitude={-122.0312} title="Infinite Loop">
              <Image systemName="infinity.circle.fill" font="title" foregroundStyle="white" background="indigo" cornerRadius="capsule" />
            </MapAnnotation>
          </MapView>
          <Text font="footnote" foregroundStyle="secondary" accessibilityIdentifier="map-center">{center ? `Centered on ${center}` : "Tap the map to move it"}</Text>
          <Toggle label="Show my location" value={locate} onChange={setLocate} />
          {locate && (
            <Text font="footnote" monospacedDigit foregroundStyle="secondary" accessibilityIdentifier="my-location">
              {error ? `Location error: ${error.message}` : position ? `You: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (±${Math.round(position.coords.accuracy)} m)` : "Locating…"}
            </Text>
          )}
        </VStack>
      </ScrollView>
    </Screen>
  );
}
