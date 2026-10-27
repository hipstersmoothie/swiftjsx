// Hacker News through Algolia's public API (https://hn.algolia.com/api).
import { formatDistanceToNowStrict } from "date-fns";

export type Story = {
  id: string;
  title: string;
  url: string | null;
  author: string;
  points: number;
  comments: number;
  createdAt: number;
  text: string | null;
};

export type Comment = { id: number; author: string | null; text: string | null; createdAt: number; children: Comment[] };

export type Feed = { id: string; title: string; icon: string; path: string };

export const feeds: Feed[] = [
  { id: "top", title: "Top", icon: "flame", path: "search?tags=front_page" },
  { id: "new", title: "New", icon: "clock", path: "search_by_date?tags=story" },
  { id: "ask", title: "Ask", icon: "questionmark.bubble", path: "search_by_date?tags=ask_hn" },
  { id: "show", title: "Show", icon: "sparkles", path: "search_by_date?tags=show_hn" },
];

const API = "https://hn.algolia.com/api/v1/";

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(API + path, { signal });
  if (!response.ok) throw new Error(`Hacker News: ${response.status} ${response.statusText}`);
  return response.json();
}

type SearchPage = { hits: any[]; page: number; nbPages: number };

export async function fetchFeed(feed: Feed, page: number, signal?: AbortSignal) {
  const data = await get<SearchPage>(`${feed.path}&hitsPerPage=30&page=${page}`, signal);
  return {
    page: data.page,
    pages: data.nbPages,
    stories: data.hits.filter((hit) => hit.title).map(toStory),
  };
}

export async function fetchItem(id: string, signal?: AbortSignal) {
  const item = await get<any>(`items/${id}`, signal);
  return {
    story: toStory({ ...item, objectID: String(item.id), num_comments: countComments(item.children) }),
    comments: (item.children as any[]).map(toComment),
  };
}

function toStory(hit: any): Story {
  return {
    id: hit.objectID,
    title: hit.title,
    url: hit.url || null,
    author: hit.author,
    points: hit.points ?? 0,
    comments: hit.num_comments ?? 0,
    createdAt: (hit.created_at_i ?? 0) * 1000,
    text: hit.story_text ?? hit.text ?? null,
  };
}

function toComment(item: any): Comment {
  return { id: item.id, author: item.author, text: item.text, createdAt: (item.created_at_i ?? 0) * 1000, children: (item.children ?? []).map(toComment) };
}

function countComments(children: any[] = []): number {
  return children.reduce((n, c) => n + (c.author ? 1 : 0) + countComments(c.children), 0);
}

export const domain = (url: string | null) => (url ? new URL(url).hostname.replace(/^www\./, "") : null);
export const ago = (time: number) => formatDistanceToNowStrict(time, { addSuffix: true });

/** HN's comment HTML as plain text: paragraphs, links, entities. */
export function htmlToText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, (_, href, text) => (text.endsWith("...") ? decode(href) : text))
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity) => decode(`&${entity};`))
    .trim();
}

const entities: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&nbsp;": " " };
function decode(entity: string): string {
  if (entities[entity]) return entities[entity];
  const hex = entity.match(/^&#x([0-9a-f]+);$/i);
  if (hex) return String.fromCodePoint(parseInt(hex[1], 16));
  const dec = entity.match(/^&#(\d+);$/);
  if (dec) return String.fromCodePoint(Number(dec[1]));
  return entity.replace(/&#x2F;/gi, "/").replace(/&#x27;/gi, "'").replace(/&amp;/g, "&");
}
