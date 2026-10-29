// XRPC over fetch. Signed out, reads go to the public AppView (no auth).
// Signed in, everything goes to the user's PDS with a Bearer token; the PDS
// proxies app.bsky reads to the AppView and handles writes itself.
//
// Writes (createRecord, deleteRecord) only ever run from explicit user
// actions while signed in.
import { useSession } from "./session";
import type {
  AtUri, Did, FeedPage, GeneratorView, Notification, PostRecord, ProfileView, ProfileViewDetailed, Session, StrongRef,
  ThreadNode, TrendingTopic,
} from "./types";

export const PUBLIC_APPVIEW = "https://public.api.bsky.app";
export const DEFAULT_PDS = "https://bsky.social";
export const DISCOVER = "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot";

export class XrpcError extends Error {
  constructor(
    readonly status: number,
    readonly error: string,
    message: string,
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | boolean | undefined | string[]>;

function query(params: Params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
    else search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

async function parse<T>(response: Response): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  let body: { error?: string; message?: string } = {};
  try {
    body = await response.json();
  } catch {}
  throw new XrpcError(response.status, body.error ?? "Error", body.message ?? `${response.status} ${response.statusText}`);
}

// One refresh at a time, shared by every request that hit an expired token.
let refreshing: Promise<Session | null> | null = null;

async function refresh(session: Session): Promise<Session | null> {
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${session.service}/xrpc/com.atproto.server.refreshSession`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.refreshJwt}` },
      });
      const next = await parse<{ did: Did; handle: string; accessJwt: string; refreshJwt: string }>(response);
      const updated: Session = { ...session, ...next };
      useSession.getState().setSession(updated);
      return updated;
    } catch {
      // The refresh token is gone or revoked: sign out.
      useSession.getState().setSession(null);
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Sends a request, authed when signed in; retries once after refreshing an expired token. */
async function send<T>(method: "GET" | "POST", nsid: string, params: Params, body?: unknown, signal?: AbortSignal): Promise<T> {
  const session = useSession.getState().session;
  const attempt = (s: Session | null) => {
    const base = s ? s.service : PUBLIC_APPVIEW;
    const headers: Record<string, string> = {};
    if (s) headers.Authorization = `Bearer ${s.accessJwt}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return fetch(`${base}/xrpc/${nsid}${query(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  };
  let response = await attempt(session);
  if (session && (response.status === 400 || response.status === 401)) {
    const clone = response.clone();
    let error = "";
    try {
      error = ((await clone.json()) as { error?: string }).error ?? "";
    } catch {}
    if (error === "ExpiredToken") {
      const next = await refresh(session);
      response = await attempt(next);
    }
  }
  return parse<T>(response);
}

const get = <T>(nsid: string, params: Params = {}, signal?: AbortSignal) => send<T>("GET", nsid, params, undefined, signal);
const post = <T>(nsid: string, body: unknown) => send<T>("POST", nsid, {}, body);

// MARK: Reads

export const getFeed = (feed: string, cursor?: string, signal?: AbortSignal) =>
  get<FeedPage>("app.bsky.feed.getFeed", { feed, cursor, limit: 30 }, signal);

export const getTimeline = (cursor?: string, signal?: AbortSignal) =>
  get<FeedPage>("app.bsky.feed.getTimeline", { cursor, limit: 30 }, signal);

export type AuthorFilter = "posts_no_replies" | "posts_with_replies" | "posts_with_media" | "posts_and_author_threads" | "posts_with_video";

export const getAuthorFeed = (actor: string, filter: AuthorFilter, cursor?: string, signal?: AbortSignal) =>
  get<FeedPage>("app.bsky.feed.getAuthorFeed", { actor, filter, cursor, limit: 30, includePins: filter === "posts_and_author_threads" }, signal);

export const getPostThread = (uri: AtUri, signal?: AbortSignal) =>
  get<{ thread: ThreadNode }>("app.bsky.feed.getPostThread", { uri, depth: 6, parentHeight: 20 }, signal);

export const getProfile = (actor: string, signal?: AbortSignal) =>
  get<ProfileViewDetailed>("app.bsky.actor.getProfile", { actor }, signal);

export const searchActors = (q: string, cursor?: string, signal?: AbortSignal) =>
  get<{ actors: ProfileView[]; cursor?: string }>("app.bsky.actor.searchActors", { q, cursor, limit: 25 }, signal);

export const searchActorsTypeahead = (q: string, signal?: AbortSignal) =>
  get<{ actors: ProfileView[] }>("app.bsky.actor.searchActorsTypeahead", { q, limit: 8 }, signal);

/** Signed in only: the public AppView answers 403. */
export const searchPosts = (q: string, sort: "top" | "latest", cursor?: string, signal?: AbortSignal) =>
  get<{ posts: import("./types").PostView[]; cursor?: string }>("app.bsky.feed.searchPosts", { q, sort, cursor, limit: 25 }, signal);

export const getTrendingTopics = (signal?: AbortSignal) =>
  get<{ topics: TrendingTopic[]; suggested: TrendingTopic[] }>("app.bsky.unspecced.getTrendingTopics", { limit: 14 }, signal);

export const getTrends = (signal?: AbortSignal) =>
  get<{ trends: import("./types").Trend[] }>("app.bsky.unspecced.getTrends", { limit: 10 }, signal);

/** Signed in only (the account's own likes). */
export const getActorLikes = (actor: string, cursor?: string, signal?: AbortSignal) =>
  get<FeedPage>("app.bsky.feed.getActorLikes", { actor, cursor, limit: 30 }, signal);

export const getActorFeeds = (actor: string, signal?: AbortSignal) =>
  get<{ feeds: GeneratorView[] }>("app.bsky.feed.getActorFeeds", { actor, limit: 50 }, signal);

export const getLists = (actor: string, signal?: AbortSignal) =>
  get<{ lists: import("./types").ListView[] }>("app.bsky.graph.getLists", { actor, limit: 50 }, signal);

export const getProfiles = (actors: string[], signal?: AbortSignal) =>
  get<{ profiles: ProfileViewDetailed[] }>("app.bsky.actor.getProfiles", { actors }, signal);

export const getSuggestions = (signal?: AbortSignal) =>
  get<{ actors: ProfileView[] }>("app.bsky.actor.getSuggestions", { limit: 8 }, signal);

export const getSuggestedFeeds = (cursor?: string, signal?: AbortSignal) =>
  get<{ feeds: GeneratorView[]; cursor?: string }>("app.bsky.feed.getSuggestedFeeds", { limit: 20, cursor }, signal);

export const getPopularFeeds = (signal?: AbortSignal) =>
  get<{ feeds: GeneratorView[]; cursor?: string }>("app.bsky.unspecced.getPopularFeedGenerators", { limit: 10 }, signal);

export const getFeedGenerators = (feeds: string[], signal?: AbortSignal) =>
  get<{ feeds: GeneratorView[] }>("app.bsky.feed.getFeedGenerators", { feeds }, signal);

export type ActorPage = { actors: ProfileView[]; cursor?: string };

export async function getFollowers(actor: string, cursor?: string, signal?: AbortSignal): Promise<ActorPage> {
  const page = await get<{ followers: ProfileView[]; cursor?: string }>("app.bsky.graph.getFollowers", { actor, cursor, limit: 50 }, signal);
  return { actors: page.followers, cursor: page.cursor };
}

export async function getFollows(actor: string, cursor?: string, signal?: AbortSignal): Promise<ActorPage> {
  const page = await get<{ follows: ProfileView[]; cursor?: string }>("app.bsky.graph.getFollows", { actor, cursor, limit: 50 }, signal);
  return { actors: page.follows, cursor: page.cursor };
}

export async function getLikes(uri: AtUri, cursor?: string, signal?: AbortSignal): Promise<ActorPage> {
  const page = await get<{ likes: { actor: ProfileView }[]; cursor?: string }>("app.bsky.feed.getLikes", { uri, cursor, limit: 50 }, signal);
  return { actors: page.likes.map((l) => l.actor), cursor: page.cursor };
}

export async function getRepostedBy(uri: AtUri, cursor?: string, signal?: AbortSignal): Promise<ActorPage> {
  const page = await get<{ repostedBy: ProfileView[]; cursor?: string }>("app.bsky.feed.getRepostedBy", { uri, cursor, limit: 50 }, signal);
  return { actors: page.repostedBy, cursor: page.cursor };
}

export const listNotifications = (cursor?: string, signal?: AbortSignal) =>
  get<{ notifications: Notification[]; cursor?: string; seenAt?: string }>("app.bsky.notification.listNotifications", { cursor, limit: 40 }, signal);

export const getUnreadCount = (signal?: AbortSignal) => get<{ count: number }>("app.bsky.notification.getUnreadCount", {}, signal);

export const getPosts = (uris: AtUri[], signal?: AbortSignal) =>
  get<{ posts: import("./types").PostView[] }>("app.bsky.feed.getPosts", { uris }, signal);

export const getPreferredFeeds = async (signal?: AbortSignal): Promise<string[]> => {
  const prefs = await get<{ preferences: { $type: string; items?: { type: string; value: string; pinned: boolean }[] }[] }>(
    "app.bsky.actor.getPreferences",
    {},
    signal,
  );
  const saved = prefs.preferences.find((p) => p.$type === "app.bsky.actor.defs#savedFeedsPrefV2");
  return (saved?.items ?? []).filter((i) => i.pinned && i.type === "feed").map((i) => i.value);
};

// MARK: Session (bsky.social or the given PDS)

export async function createSession(identifier: string, password: string, service = DEFAULT_PDS): Promise<Session> {
  const response = await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const result = await parse<{
    did: Did;
    handle: string;
    accessJwt: string;
    refreshJwt: string;
    didDoc?: { service?: { id: string; type: string; serviceEndpoint: string }[] };
  }>(response);
  const pds = result.didDoc?.service?.find((s) => s.id === "#atproto_pds")?.serviceEndpoint;
  return { did: result.did, handle: result.handle, accessJwt: result.accessJwt, refreshJwt: result.refreshJwt, service: pds ?? service };
}

export async function deleteSession(session: Session) {
  try {
    await fetch(`${session.service}/xrpc/com.atproto.server.deleteSession`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.refreshJwt}` },
    });
  } catch {}
}

// MARK: Writes (signed in only)

function requireSession(): Session {
  const session = useSession.getState().session;
  if (!session) throw new Error("Sign in to do that.");
  return session;
}

async function createRecord(collection: string, record: Record<string, unknown>): Promise<StrongRef> {
  const session = requireSession();
  // No rkey: the PDS makes a TID.
  return post<StrongRef>("com.atproto.repo.createRecord", { repo: session.did, collection, record });
}

async function deleteRecord(uri: AtUri) {
  const session = requireSession();
  const [, , repo, collection, rkey] = uri.split("/");
  if (repo !== session.did) throw new Error("Not your record.");
  await post<unknown>("com.atproto.repo.deleteRecord", { repo, collection, rkey });
}

const now = () => new Date().toISOString();

export const like = (subject: StrongRef) =>
  createRecord("app.bsky.feed.like", { $type: "app.bsky.feed.like", subject, createdAt: now() });
export const repost = (subject: StrongRef) =>
  createRecord("app.bsky.feed.repost", { $type: "app.bsky.feed.repost", subject, createdAt: now() });
export const follow = (did: Did) =>
  createRecord("app.bsky.graph.follow", { $type: "app.bsky.graph.follow", subject: did, createdAt: now() });
export const undo = (uri: AtUri) => deleteRecord(uri);

export const createPost = (record: Omit<PostRecord, "createdAt" | "$type">) =>
  createRecord("app.bsky.feed.post", { $type: "app.bsky.feed.post", ...record, createdAt: now() });

export const resolveHandle = (handle: string) =>
  get<{ did: Did }>("com.atproto.identity.resolveHandle", { handle });

export const updateSeen = () => post<unknown>("app.bsky.notification.updateSeen", { seenAt: now() });

// MARK: URLs

/** https://bsky.app link for a post (for sharing). */
export function postWebURL(uri: AtUri, handle: string) {
  const rkey = uri.split("/").pop();
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

export const profileWebURL = (handle: string) => `https://bsky.app/profile/${handle}`;
