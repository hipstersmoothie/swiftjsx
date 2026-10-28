// Rich text: facets index the post's text by UTF-8 byte offsets, so we slice
// the encoded bytes and decode each run. Also the reverse for composing:
// find mentions, links and hashtags in typed text and make facets for them.
import type { Facet, FacetFeature } from "./types";

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "mention"; text: string; did: string }
  | { kind: "link"; text: string; uri: string }
  | { kind: "tag"; text: string; tag: string };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** The text split into plain runs and facet runs, in order. Bad facets (overlapping, out of range) are dropped. */
export function segments(text: string, facets: Facet[] | undefined): Segment[] {
  if (!facets?.length) return text ? [{ kind: "text", text }] : [];
  const bytes = encoder.encode(text);
  const sorted = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart);
  const out: Segment[] = [];
  let cursor = 0;
  for (const facet of sorted) {
    const { byteStart, byteEnd } = facet.index;
    if (byteStart < cursor || byteEnd > bytes.length || byteEnd <= byteStart) continue;
    if (byteStart > cursor) out.push({ kind: "text", text: decoder.decode(bytes.subarray(cursor, byteStart)) });
    const run = decoder.decode(bytes.subarray(byteStart, byteEnd));
    out.push(toSegment(run, facet.features[0]));
    cursor = byteEnd;
  }
  if (cursor < bytes.length) out.push({ kind: "text", text: decoder.decode(bytes.subarray(cursor)) });
  return out;
}

function toSegment(text: string, feature: FacetFeature | undefined): Segment {
  switch (feature?.$type) {
    case "app.bsky.richtext.facet#mention":
      return { kind: "mention", text, did: feature.did };
    case "app.bsky.richtext.facet#link":
      return { kind: "link", text, uri: feature.uri };
    case "app.bsky.richtext.facet#tag":
      return { kind: "tag", text, tag: feature.tag };
    default:
      return { kind: "text", text };
  }
}

// MARK: Graphemes

type Segmenter = { segment(text: string): Iterable<unknown> };
const IntlSegmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: "grapheme" }) => Segmenter }).Segmenter;
const graphemeSegmenter = IntlSegmenter ? new IntlSegmenter(undefined, { granularity: "grapheme" }) : null;

/** What Bluesky's 300-character limit counts: user-perceived characters (an emoji family is one). */
export function graphemeLength(text: string): number {
  if (graphemeSegmenter) {
    let n = 0;
    for (const _ of graphemeSegmenter.segment(text)) n++;
    return n;
  }
  // Fallback: code points, which over-counts combined emoji.
  return Array.from(text).length;
}

export const MAX_GRAPHEMES = 300;

// MARK: Detecting facets while composing

export type Detected =
  | { kind: "mention"; start: number; end: number; handle: string }
  | { kind: "link"; start: number; end: number; uri: string }
  | { kind: "tag"; start: number; end: number; tag: string };

const MENTION = /(^|\s|\()@([a-zA-Z0-9.-]+(?:\.[a-zA-Z0-9-]+)+)\b/g;
const URL_RE = /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/gim;
const TAG = /(^|\s)[#＃]((?!️)[^\s­⁠ ​‌‍⃢]*[^\d\s\p{P}­⁠ ​‌‍⃢]+[^\s­⁠ ​‌‍⃢]*)?/gu;
const TLDS = new Set(["com", "net", "org", "app", "dev", "io", "co", "social", "xyz", "me", "ai", "news", "blog", "uk", "de", "fr", "jp", "ca", "us", "eu", "edu", "gov", "info", "tv"]);

/** Mentions, links and #tags in `text`, with UTF-16 ranges (for highlighting and facets). */
export function detect(text: string): Detected[] {
  const found: Detected[] = [];
  for (const m of text.matchAll(MENTION)) {
    const start = (m.index ?? 0) + m[1].length;
    found.push({ kind: "mention", start, end: start + 1 + m[2].length, handle: m[2].replace(/\.$/, "") });
  }
  for (const m of text.matchAll(URL_RE)) {
    let uri = m[2];
    const start = (m.index ?? 0) + m[1].length;
    if (!uri.startsWith("http")) {
      const domain = m.groups?.domain ?? "";
      const tld = domain.split(".").pop()?.toLowerCase() ?? "";
      if (!TLDS.has(tld) || text[start - 1] === "@") continue;
      uri = `https://${uri}`;
    }
    // Trailing punctuation isn't part of the link.
    let shown = m[2];
    while (/[.,;:!?)\]]$/.test(shown)) shown = shown.slice(0, -1);
    uri = uri.slice(0, uri.length - (m[2].length - shown.length));
    found.push({ kind: "link", start, end: start + shown.length, uri });
  }
  for (const m of text.matchAll(TAG)) {
    if (!m[2]) continue;
    let tag = m[2].replace(/\p{P}+$/u, "");
    if (tag.length > 64) continue;
    const start = (m.index ?? 0) + m[1].length;
    found.push({ kind: "tag", start, end: start + 1 + tag.length, tag });
    tag = "";
  }
  // Mentions inside links (an email, a URL with @) lose to the link.
  return found
    .sort((a, b) => a.start - b.start)
    .filter((d, i, all) => !all.some((o, j) => j !== i && o.kind === "link" && d.kind !== "link" && d.start >= o.start && d.end <= o.end));
}

const utf8Length = (s: string) => encoder.encode(s).length;

/**
 * Facets for a post. Mentions need DIDs, so `resolve` turns handles into
 * DIDs (unresolvable mentions are left as plain text).
 */
export async function facetsFor(text: string, resolve: (handle: string) => Promise<string | null>): Promise<Facet[]> {
  const facets: Facet[] = [];
  for (const d of detect(text)) {
    const index = { byteStart: utf8Length(text.slice(0, d.start)), byteEnd: utf8Length(text.slice(0, d.end)) };
    if (d.kind === "link") facets.push({ index, features: [{ $type: "app.bsky.richtext.facet#link", uri: d.uri }] });
    else if (d.kind === "tag") facets.push({ index, features: [{ $type: "app.bsky.richtext.facet#tag", tag: d.tag }] });
    else {
      const did = await resolve(d.handle);
      if (did) facets.push({ index, features: [{ $type: "app.bsky.richtext.facet#mention", did }] });
    }
  }
  return facets;
}

/** For display in link runs: "example.com/some/pa…". */
export function shortenLink(uri: string): string {
  try {
    const url = new URL(uri);
    let s = url.host.replace(/^www\./, "") + (url.pathname === "/" ? "" : url.pathname) + url.search;
    if (s.length > 30) s = s.slice(0, 27) + "…";
    return s;
  } catch {
    return uri;
  }
}
