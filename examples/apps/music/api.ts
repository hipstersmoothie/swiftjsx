// The iTunes Search and Lookup APIs (no key): songs with 30-second AAC previews.
// https://performance-partners.apple.com/search-api
import { z } from "zod";
import { format } from "swiftjsx";

export type Track = {
  id: number;
  title: string;
  artist: string;
  artistId: number;
  album: string;
  albumId: number;
  /** 100×100 artwork; `art(url, size)` for other sizes. */
  artwork: string;
  previewUrl: string;
  /** Length of the full song (previews are ~30 s). */
  durationMs: number;
  trackNumber: number;
  discNumber: number;
  genre: string;
  year: string;
  explicit: boolean;
};

export type Album = {
  id: number;
  title: string;
  artist: string;
  artistId: number;
  artwork: string;
  genre: string;
  year: string;
  trackCount: number;
  copyright: string;
  explicit: boolean;
};

export type Artist = { id: number; name: string; genre: string };

const Result = z.object({
  wrapperType: z.string().optional(),
  kind: z.string().optional(),
  trackId: z.number().optional(),
  trackName: z.string().optional(),
  artistId: z.number().optional(),
  artistName: z.string().optional(),
  collectionId: z.number().optional(),
  collectionName: z.string().optional(),
  artworkUrl100: z.string().optional(),
  previewUrl: z.string().optional(),
  trackTimeMillis: z.number().optional(),
  trackNumber: z.number().optional(),
  discNumber: z.number().optional(),
  primaryGenreName: z.string().optional(),
  releaseDate: z.string().optional(),
  trackExplicitness: z.string().optional(),
  collectionExplicitness: z.string().optional(),
  trackCount: z.number().optional(),
  copyright: z.string().optional(),
});
type Result = z.infer<typeof Result>;

const Response = z.object({ resultCount: z.number(), results: z.array(Result) });

const BASE = "https://itunes.apple.com/";

async function get(path: string, signal?: AbortSignal): Promise<Result[]> {
  const response = await fetch(BASE + path, { signal });
  if (!response.ok) throw new Error(`iTunes: ${response.status} ${response.statusText}`);
  const parsed = Response.safeParse(await response.json());
  if (!parsed.success) throw new Error("iTunes sent a response this app doesn't understand.");
  return parsed.data.results;
}

function toTrack(r: Result): Track | null {
  if (r.kind !== "song" || !r.trackId || !r.trackName || !r.previewUrl) return null;
  return {
    id: r.trackId,
    title: r.trackName,
    artist: r.artistName ?? "Unknown Artist",
    artistId: r.artistId ?? 0,
    album: r.collectionName ?? "",
    albumId: r.collectionId ?? 0,
    artwork: r.artworkUrl100 ?? "",
    previewUrl: r.previewUrl,
    durationMs: r.trackTimeMillis ?? 30_000,
    trackNumber: r.trackNumber ?? 0,
    discNumber: r.discNumber ?? 1,
    genre: r.primaryGenreName ?? "",
    year: (r.releaseDate ?? "").slice(0, 4),
    explicit: r.trackExplicitness === "explicit",
  };
}

function toAlbum(r: Result): Album | null {
  if (r.wrapperType !== "collection" || !r.collectionId || !r.collectionName) return null;
  return {
    id: r.collectionId,
    title: r.collectionName,
    artist: r.artistName ?? "Various Artists",
    artistId: r.artistId ?? 0,
    artwork: r.artworkUrl100 ?? "",
    genre: r.primaryGenreName ?? "",
    year: (r.releaseDate ?? "").slice(0, 4),
    trackCount: r.trackCount ?? 0,
    copyright: r.copyright ?? "",
    explicit: r.collectionExplicitness === "explicit",
  };
}

const compact = <T,>(items: (T | null)[]) => items.filter((x): x is T => x !== null);

export async function searchSongs(term: string, signal?: AbortSignal): Promise<Track[]> {
  const q = new URLSearchParams({ term, media: "music", entity: "song", limit: "30" });
  return compact((await get(`search?${q}`, signal)).map(toTrack));
}

export async function lookupAlbum(id: number, signal?: AbortSignal): Promise<{ album: Album | null; tracks: Track[] }> {
  const results = await get(`lookup?id=${id}&entity=song`, signal);
  const tracks = compact(results.map(toTrack)).sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber);
  return { album: results.map(toAlbum).find((a) => a !== null) ?? null, tracks };
}

export async function lookupArtist(id: number, signal?: AbortSignal): Promise<{ artist: Artist | null; songs: Track[]; albums: Album[] }> {
  const [songResults, albumResults] = await Promise.all([
    get(`lookup?id=${id}&entity=song&limit=25`, signal),
    get(`lookup?id=${id}&entity=album&limit=50`, signal),
  ]);
  const info = songResults.find((r) => r.wrapperType === "artist");
  const albums = compact(albumResults.map(toAlbum))
    // Singles and compilations by other artists clutter the shelf.
    .filter((a) => a.artistId === id)
    .sort((a, b) => b.year.localeCompare(a.year));
  return {
    artist: info ? { id, name: info.artistName ?? "", genre: info.primaryGenreName ?? "" } : null,
    songs: compact(songResults.map(toTrack)),
    albums,
  };
}

/** The same artwork at another size (the CDN renders any `NxNbb`). */
export const art = (url: string, size: number) => url.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`);

/** 83 → "1:23"; a time not known yet → "–:––". Floored: a clock doesn't round up. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "–:––";
  return format.duration(Math.floor(seconds));
}

/** "42 min", "1 hr 5 min". */
export const formatMinutes = (ms: number) => format.duration(Math.max(ms, 60_000) / 1000, "abbreviated");

export const genres: { title: string; term: string; colors: [`#${string}`, `#${string}`] }[] = [
  { title: "Pop", term: "pop hits", colors: ["#ff2d55", "#ff6b3d"] },
  { title: "Hip-Hop", term: "hip hop", colors: ["#5e5ce6", "#bf5af2"] },
  { title: "Jazz", term: "jazz standards", colors: ["#0a84ff", "#64d2ff"] },
  { title: "Electronic", term: "daft punk", colors: ["#30d158", "#00c7be"] },
  { title: "Classical", term: "chopin nocturne", colors: ["#a2845e", "#d4a373"] },
  { title: "Rock", term: "classic rock", colors: ["#ff453a", "#ff9f0a"] },
  { title: "Lo-fi", term: "lofi beats", colors: ["#6e6e73", "#8e8e93"] },
  { title: "Soul", term: "motown soul", colors: ["#ff9f0a", "#ffd60a"] },
];
