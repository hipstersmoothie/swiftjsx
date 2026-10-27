// Artwork bytes as NSData (for the lock screen) and the artwork's average
// color (to tint Now Playing), via Core Image's CIAreaAverage filter.
// Without the native backend the tint comes from a palette, picked by hash.
import { useQuery } from "@tanstack/react-query";
import { native, isNativeAvailable, type Native } from "swiftjsx";
import { art } from "./api";

type NSData = InstanceType<Native["NSData"]>;
type CIContext = InstanceType<Native["CIContext"]>;

const dataCache = new Map<string, Promise<NSData>>();

/** Downloads with fetch (off the main thread) and wraps the bytes in NSData. */
export function artworkData(url: string): Promise<NSData> {
  let data = dataCache.get(url);
  if (!data) {
    data = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`artwork: ${r.status}`);
        return r.arrayBuffer();
      })
      .then((buffer) => native.NSData.dataWithBytesLength(new Uint8Array(buffer), buffer.byteLength));
    data.catch(() => dataCache.delete(url));
    dataCache.set(url, data);
    if (dataCache.size > 40) dataCache.delete(dataCache.keys().next().value!);
  }
  return data;
}

let context: CIContext | null = null;

/** Core Image is thread-safe, so this runs right here on the JS thread. */
async function averageColor(url: string): Promise<[number, number, number] | null> {
  const n = native;
  const image = n.CIImage.imageWithData(await artworkData(url));
  if (!image) return null;
  const filter = n.CIFilter.filterWithNameWithInputParameters("CIAreaAverage", {
    [n.kCIInputImageKey]: image,
    [n.kCIInputExtentKey]: n.CIVector.vectorWithCGRect(image.extent),
  });
  const output = filter?.outputImage;
  if (!output) return null;
  context ??= n.CIContext.contextWithOptions({ [n.kCIContextWorkingColorSpace]: n.NSNull.null() });
  // A typed array is a valid `void *` for NativeScript: Core Image writes the
  // one RGBA pixel straight into it.
  const pixel = new Uint8Array(4);
  const rect = { origin: { x: 0, y: 0 }, size: { width: 1, height: 1 } };
  context.renderToBitmapRowBytesBoundsFormatColorSpace(output, pixel, 4, rect, n.kCIFormatRGBA8, null);
  return [pixel[0], pixel[1], pixel[2]];
}

const palette: [number, number, number][] = [
  [196, 54, 74], [64, 92, 186], [42, 128, 112], [150, 78, 168], [196, 112, 42], [52, 120, 160], [120, 96, 80],
];

function hashColor(key: string): [number, number, number] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

export type Tint = { top: `#${string}`; bottom: `#${string}`; accent: `#${string}` };

/**
 * A background for white text: the artwork's hue, with lightness clamped so
 * white stays readable, fading to a darker shade.
 */
function toTint([r, g, b]: [number, number, number]): Tint {
  const [h, s, l] = rgbToHsl(r, g, b);
  const sat = Math.min(0.75, s * 1.15);
  const top = hslToHex(h, sat, Math.min(0.42, Math.max(0.26, l)));
  const bottom = hslToHex(h, sat, Math.min(0.16, Math.max(0.08, l * 0.4)));
  const accent = hslToHex(h, Math.min(0.9, sat + 0.2), 0.72);
  return { top, bottom, accent };
}

export const defaultTint: Tint = { top: "#3a3a3c", bottom: "#1c1c1e", accent: "#ff375f" };

/** The tint for an artwork URL; `defaultTint` until it's computed. */
export function useArtworkTint(artwork: string | undefined): Tint {
  const { data } = useQuery({
    queryKey: ["tint", artwork],
    enabled: !!artwork,
    staleTime: Infinity,
    queryFn: async () => {
      const url = art(artwork!, 100);
      if (isNativeAvailable() && "CIImage" in native) {
        try {
          const rgb = await averageColor(url);
          if (rgb) return toTint(rgb);
        } catch (error) {
          console.warn("artwork color:", error);
        }
      }
      return toTint(hashColor(url));
    },
  });
  return data ?? defaultTint;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number): `#${string}` {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
