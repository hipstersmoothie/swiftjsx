import { useState } from "react";
import { Screen, ScrollView, VStack, HStack, Text, Button, Video, WebView, MapView, Marker, MapAnnotation, Image, type MapRegion } from "swiftjsx";

const VIDEO = "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8";
const PAGE = `<!doctype html><meta name="viewport" content="width=device-width">
<body style="font: 17px -apple-system; padding: 12px">
  <p>A web page. Its button talks to React:</p>
  <button onclick="window.webkit.messageHandlers.swiftjsx.postMessage({ clicked: Date.now() })">Send a message</button>
</body>`;
const PARK: MapRegion = { latitude: 37.3349, longitude: -122.009, latitudeDelta: 0.02 };

export function MediaDemo() {
  const [paused, setPaused] = useState(true);
  const [video, setVideo] = useState("loading…");
  const [message, setMessage] = useState("none yet");
  const [loaded, setLoaded] = useState("");
  const [region, setRegion] = useState(PARK);
  const [center, setCenter] = useState("");

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
            accessibilityIdentifier="map"
          >
            <Marker latitude={37.3349} longitude={-122.009} title="Apple Park" systemImage="apple.logo" tint="gray" />
            <MapAnnotation latitude={37.3318} longitude={-122.0312} title="Infinite Loop">
              <Image systemName="infinity.circle.fill" font="title" foregroundStyle="white" background="indigo" cornerRadius="capsule" />
            </MapAnnotation>
          </MapView>
          <Text font="footnote" foregroundStyle="secondary" accessibilityIdentifier="map-center">{center ? `Centered on ${center}` : "Tap the map to move it"}</Text>
        </VStack>
      </ScrollView>
    </Screen>
  );
}
