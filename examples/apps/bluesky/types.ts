// The slice of the AT Protocol / app.bsky lexicons this client reads. Views
// come from the AppView (hydrated), records are what users wrote.

export type Did = string;
export type AtUri = string;

export type Label = { src: Did; uri: string; val: string; neg?: boolean };

export type ProfileViewBasic = {
  did: Did;
  handle: string;
  displayName?: string;
  avatar?: string;
  labels?: Label[];
  viewer?: ViewerState;
  createdAt?: string;
  associated?: { labeler?: boolean; feedgens?: number; lists?: number; starterPacks?: number };
  verification?: { verifiedStatus?: "valid" | "invalid" | "none" };
};

export type ProfileView = ProfileViewBasic & { description?: string; indexedAt?: string };

export type ProfileViewDetailed = ProfileView & {
  banner?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  pinnedPost?: { uri: AtUri; cid: string };
};

export type ViewerState = {
  muted?: boolean;
  blockedBy?: boolean;
  blocking?: AtUri;
  following?: AtUri;
  followedBy?: AtUri;
  knownFollowers?: { count: number; followers: ProfileViewBasic[] };
};

// MARK: Rich text

export type Facet = {
  index: { byteStart: number; byteEnd: number };
  features: FacetFeature[];
};

export type FacetFeature =
  | { $type: "app.bsky.richtext.facet#mention"; did: Did }
  | { $type: "app.bsky.richtext.facet#link"; uri: string }
  | { $type: "app.bsky.richtext.facet#tag"; tag: string };

// MARK: Posts

export type StrongRef = { uri: AtUri; cid: string };

export type PostRecord = {
  $type?: "app.bsky.feed.post";
  text: string;
  facets?: Facet[];
  createdAt: string;
  langs?: string[];
  reply?: { root: StrongRef; parent: StrongRef };
  embed?: unknown;
};

export type AspectRatio = { width: number; height: number };

export type ImageView = { thumb: string; fullsize: string; alt: string; aspectRatio?: AspectRatio };

export type ExternalView = { uri: string; title: string; description: string; thumb?: string };

export type EmbedView =
  | { $type: "app.bsky.embed.images#view"; images: ImageView[] }
  | { $type: "app.bsky.embed.external#view"; external: ExternalView }
  | { $type: "app.bsky.embed.video#view"; cid: string; playlist: string; thumbnail?: string; alt?: string; aspectRatio?: AspectRatio }
  | { $type: "app.bsky.embed.record#view"; record: EmbedRecord }
  | { $type: "app.bsky.embed.recordWithMedia#view"; record: { record: EmbedRecord }; media: MediaView };

export type MediaView = Extract<EmbedView, { $type: "app.bsky.embed.images#view" | "app.bsky.embed.external#view" | "app.bsky.embed.video#view" }>;

export type EmbedRecord =
  | {
      $type: "app.bsky.embed.record#viewRecord";
      uri: AtUri;
      cid: string;
      author: ProfileViewBasic;
      value: PostRecord;
      embeds?: EmbedView[];
      indexedAt: string;
      likeCount?: number;
      replyCount?: number;
      repostCount?: number;
      quoteCount?: number;
    }
  | { $type: "app.bsky.embed.record#viewNotFound"; uri: AtUri }
  | { $type: "app.bsky.embed.record#viewBlocked"; uri: AtUri; author?: { did: Did } }
  | { $type: "app.bsky.embed.record#viewDetached"; uri: AtUri }
  | {
      $type: "app.bsky.feed.defs#generatorView";
      uri: AtUri;
      displayName: string;
      description?: string;
      avatar?: string;
      creator: ProfileViewBasic;
      likeCount?: number;
    }
  | { $type: "app.bsky.graph.defs#listView"; uri: AtUri; name: string; purpose: string; avatar?: string; creator: ProfileViewBasic }
  | { $type: "app.bsky.graph.defs#starterPackViewBasic"; uri: AtUri; record: { name?: string }; creator: ProfileViewBasic }
  | { $type: "app.bsky.labeler.defs#labelerView"; uri: AtUri; creator: ProfileViewBasic };

export type PostView = {
  uri: AtUri;
  cid: string;
  author: ProfileViewBasic;
  record: PostRecord;
  embed?: EmbedView;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  quoteCount?: number;
  indexedAt: string;
  labels?: Label[];
  viewer?: { like?: AtUri; repost?: AtUri; replyDisabled?: boolean; threadMuted?: boolean };
};

export type NotFoundPost = { $type: "app.bsky.feed.defs#notFoundPost"; uri: AtUri; notFound: true };
export type BlockedPost = { $type: "app.bsky.feed.defs#blockedPost"; uri: AtUri; blocked: true; author: { did: Did } };

export type ReplyRef = {
  root: (PostView & { $type?: "app.bsky.feed.defs#postView" }) | NotFoundPost | BlockedPost;
  parent: (PostView & { $type?: "app.bsky.feed.defs#postView" }) | NotFoundPost | BlockedPost;
  grandparentAuthor?: ProfileViewBasic;
};

export type FeedViewPost = {
  post: PostView;
  reply?: ReplyRef;
  reason?: { $type: "app.bsky.feed.defs#reasonRepost"; by: ProfileViewBasic; indexedAt: string } | { $type: "app.bsky.feed.defs#reasonPin" };
  feedContext?: string;
};

export type FeedPage = { feed: FeedViewPost[]; cursor?: string };

// MARK: Threads

export type ThreadViewPost = {
  $type: "app.bsky.feed.defs#threadViewPost";
  post: PostView;
  parent?: ThreadNode;
  replies?: ThreadNode[];
};
export type ThreadNode = ThreadViewPost | NotFoundPost | BlockedPost;

// MARK: Feeds, search, notifications

export type GeneratorView = {
  uri: AtUri;
  cid: string;
  did: Did;
  creator: ProfileView;
  displayName: string;
  description?: string;
  descriptionFacets?: Facet[];
  avatar?: string;
  likeCount?: number;
};

export type TrendingTopic = { topic: string; displayName?: string; description?: string; link: string };

/** A trend (app.bsky.unspecced.getTrends): a topic with its post count, status and some posters. */
export type Trend = {
  topic: string;
  displayName: string;
  link: string;
  startedAt: string;
  postCount: number;
  status?: "hot" | string;
  category?: string;
  actors: ProfileViewBasic[];
};

export type ListView = { uri: AtUri; name: string; purpose: string; avatar?: string; description?: string; creator: ProfileViewBasic; listItemCount?: number };

export type NotificationReason = "like" | "repost" | "follow" | "mention" | "reply" | "quote" | "starterpack-joined" | "like-via-repost" | "repost-via-repost" | "subscribed-post" | "verified" | "unverified";

export type Notification = {
  uri: AtUri;
  cid: string;
  author: ProfileView;
  reason: NotificationReason;
  reasonSubject?: AtUri;
  record: PostRecord | Record<string, unknown>;
  isRead: boolean;
  indexedAt: string;
};

export type Session = {
  did: Did;
  handle: string;
  accessJwt: string;
  refreshJwt: string;
  /** The user's PDS, from the DID document in createSession's response (falls back to bsky.social). */
  service: string;
};
