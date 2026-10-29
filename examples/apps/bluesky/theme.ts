// Bluesky's design tokens: the palette of each theme (light, dim, dark), the
// type scale on Inter (loaded at launch; the system font if that fails), and
// spacing and radii.
import { hot, loadFont, useColorScheme, type Color, type Font } from "swiftjsx";
import { useSettings } from "./session";

// MARK: Palettes

export type ThemeName = "light" | "dim" | "dark";

export type Palette = {
  name: ThemeName;
  scheme: "light" | "dark";
  /** Screen background (contrast_0). */
  bg: Color;
  /** Subtle fills: chips, placeholders, pressed rows (contrast_25 / 50). */
  bg25: Color;
  bg50: Color;
  /** Skeletons, avatars without images (contrast_100). */
  bg100: Color;
  /** Hairlines between posts and around cards. */
  border: Color;
  borderStrong: Color;
  text: Color;
  /** Secondary text: handles, timestamps, counts (text_contrast_medium). */
  textMedium: Color;
  /** Icons in the action bar, placeholders (text_contrast_low). */
  textLow: Color;
  primary: Color;
  /** Tinted backgrounds: unread notifications, the selected drawer row. */
  primarySubtle: Color;
  like: Color;
  repost: Color;
  negative: Color;
  /** The shimmer's highlight over skeletons. */
  shimmer: Color;
  /** Backdrops behind the drawer and the image viewer. */
  scrim: Color;
};

/** The brand blue (light theme's primary): toasts' symbols, outside any theme. */
export const BRAND: Color = "#1083FE";

export const light: Palette = {
  name: "light",
  scheme: "light",
  bg: "#FFFFFF",
  bg25: "#F9FAFB",
  bg50: "#EFF2F6",
  bg100: "#DCE2EA",
  border: "#E2E7EE",
  borderStrong: "#C0CAD8",
  text: "#0B0F14",
  textMedium: "#42576C",
  textLow: "#6F869F",
  primary: BRAND,
  primarySubtle: "#EBF3FF",
  like: "#EC4899",
  repost: "#13B55C",
  negative: "#EB2452",
  shimmer: "#FFFFFF/70",
  scrim: "#000000/50",
};

export const dim: Palette = {
  name: "dim",
  scheme: "dark",
  bg: "#161E27",
  bg25: "#1A2330",
  bg50: "#1E2936",
  bg100: "#2A3848",
  border: "#2E3D4F",
  borderStrong: "#405168",
  text: "#FFFFFF",
  textMedium: "#AEBBC9",
  textLow: "#8396AC",
  primary: "#208BFE",
  primarySubtle: "#1B2C42",
  like: "#EC4899",
  repost: "#20BC6C",
  negative: "#FF5C7A",
  shimmer: "#FFFFFF/8",
  scrim: "#000000/60",
};

export const dark: Palette = {
  name: "dark",
  scheme: "dark",
  bg: "#000000",
  bg25: "#0A0D11",
  bg50: "#12171D",
  bg100: "#1E252E",
  border: "#232B35",
  borderStrong: "#36414E",
  text: "#FFFFFF",
  textMedium: "#A3B0BF",
  textLow: "#7A8A9C",
  primary: "#208BFE",
  primarySubtle: "#0F1E30",
  like: "#EC4899",
  repost: "#20BC6C",
  negative: "#FF5C7A",
  shimmer: "#FFFFFF/7",
  scrim: "#000000/70",
};

/** The palette for the app's settings (color mode, and which dark theme) and the system's scheme. */
export function useTheme(): Palette {
  const mode = useSettings((s) => s.appearance);
  const darkTheme = useSettings((s) => s.darkTheme);
  const system = useColorScheme();
  const scheme = mode === "system" ? system : mode;
  if (scheme === "light") return light;
  return darkTheme === "dark" ? dark : dim;
}

// MARK: Type

type Weight = "regular" | "medium" | "semibold" | "bold" | "heavy";

/** The custom font's name once it's registered (kept across Fast Refresh). */
const fonts: { name: string | null; state: "idle" | "loading" | "done" } = (hot.data.blueskyFonts ??= { name: null, state: "idle" });

const INTER = "https://rsms.me/inter/font-files/InterVariable.ttf";

/** Registers Inter (OFL, rsms.me), giving up after `timeout` ms; resolves either way. */
export function loadInter(timeout = 2500): Promise<void> {
  if (fonts.state === "done") return Promise.resolve();
  fonts.state = "loading";
  const load = loadFont(INTER)
    .then(({ names, family }) => {
      fonts.name = names.find((n) => /Regular|Variable/.test(n)) ?? names[0] ?? family;
    })
    .catch(() => {
      fonts.name = null;
    });
  const timer = new Promise<void>((resolve) => setTimeout(resolve, timeout));
  return Promise.race([load, timer]).then(() => {
    fonts.state = "done";
  });
}

export const fontsReady = () => fonts.state === "done";

const relativeTo = (size: number) =>
  size >= 28 ? "title" : size >= 22 ? "title2" : size >= 19 ? "title3" : size >= 16 ? "body" : size >= 14 ? "subheadline" : size >= 12 ? "footnote" : "caption2";

/** Bluesky's type at `size` points: Inter when it loaded, else the system font. Scales with Dynamic Type. */
export function ty(size: number, weight: Weight = "regular"): Font {
  return fonts.name ? { name: fonts.name, size, weight, relativeTo: relativeTo(size) } : { size, weight, relativeTo: relativeTo(size) };
}

/** The scale (ALF): 2xs 10, xs 12, sm 14, md 15, lg 18, xl 20, 2xl 22, 3xl 26. */
export const T = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 15,
  lg: 18,
  xl: 20,
  xxl: 22,
  xxxl: 26,
  post: 15.5,
  focus: 18,
} as const;

// MARK: Layout

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20 } as const;
export const radius = { xs: 4, sm: 8, md: 12, lg: 16, full: 999 } as const;
