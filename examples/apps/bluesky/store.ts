// In-memory app state shared across tabs: optimistic likes, reposts and
// follows (overriding what the AppView said until the next fetch), and UI
// that any screen can open (image viewer, composer, sign-in, toast).
import { create } from "zustand";
import { hot, haptic, type Frame } from "swiftjsx";
import * as api from "./api";
import { useSession } from "./session";
import type { ImageView, PostView, ProfileViewBasic } from "./types";

// MARK: Interactions

type Override = { like?: string | null; likeCount?: number; repost?: string | null; repostCount?: number };

type Interactions = {
  posts: Record<string, Override>;
  /** did → follow record URI, or null when unfollowed here. */
  follows: Record<string, string | null>;
  toggleLike(post: PostView): Promise<void>;
  toggleRepost(post: PostView): Promise<void>;
  toggleFollow(actor: ProfileViewBasic): Promise<void>;
};

const PENDING = "pending";

const makeInteractions = () =>
  create<Interactions>()((set, get) => {
    const patch = (uri: string, change: Override) => set(({ posts }) => ({ posts: { ...posts, [uri]: { ...posts[uri], ...change } } }));

    return {
      posts: {},
      follows: {},

      toggleLike: async (post) => {
        if (!requireSignIn("like posts")) return;
        const current = get().posts[post.uri] ?? {};
        const like = current.like !== undefined ? current.like : (post.viewer?.like ?? null);
        const count = current.likeCount ?? post.likeCount ?? 0;
        if (like === PENDING) return;
        if (like) {
          patch(post.uri, { like: null, likeCount: Math.max(0, count - 1) });
          try {
            await api.undo(like);
          } catch {
            patch(post.uri, { like, likeCount: count });
            toast("Couldn't remove your like", "exclamationmark.triangle");
          }
        } else {
          haptic("light");
          patch(post.uri, { like: PENDING, likeCount: count + 1 });
          try {
            const ref = await api.like({ uri: post.uri, cid: post.cid });
            patch(post.uri, { like: ref.uri });
          } catch {
            patch(post.uri, { like: null, likeCount: count });
            toast("Couldn't like that post", "exclamationmark.triangle");
          }
        }
      },

      toggleRepost: async (post) => {
        if (!requireSignIn("repost")) return;
        const current = get().posts[post.uri] ?? {};
        const repost = current.repost !== undefined ? current.repost : (post.viewer?.repost ?? null);
        const count = current.repostCount ?? post.repostCount ?? 0;
        if (repost === PENDING) return;
        if (repost) {
          patch(post.uri, { repost: null, repostCount: Math.max(0, count - 1) });
          try {
            await api.undo(repost);
          } catch {
            patch(post.uri, { repost, repostCount: count });
            toast("Couldn't undo the repost", "exclamationmark.triangle");
          }
        } else {
          haptic("medium");
          patch(post.uri, { repost: PENDING, repostCount: count + 1 });
          try {
            const ref = await api.repost({ uri: post.uri, cid: post.cid });
            patch(post.uri, { repost: ref.uri });
            toast("Reposted", "arrow.2.squarepath");
          } catch {
            patch(post.uri, { repost: null, repostCount: count });
            toast("Couldn't repost", "exclamationmark.triangle");
          }
        }
      },

      toggleFollow: async (actor) => {
        if (!requireSignIn("follow people")) return;
        const known = get().follows[actor.did];
        const following = known !== undefined ? known : (actor.viewer?.following ?? null);
        if (following === PENDING) return;
        const setFollow = (value: string | null) => set(({ follows }) => ({ follows: { ...follows, [actor.did]: value } }));
        if (following) {
          setFollow(null);
          try {
            await api.undo(following);
          } catch {
            setFollow(following);
            toast("Couldn't unfollow", "exclamationmark.triangle");
          }
        } else {
          haptic("success");
          setFollow(PENDING);
          try {
            const ref = await api.follow(actor.did);
            setFollow(ref.uri);
          } catch {
            setFollow(null);
            toast("Couldn't follow", "exclamationmark.triangle");
          }
        }
      },
    };
  });

export const useInteractions: ReturnType<typeof makeInteractions> = (hot.data.blueskyInteractions ??= makeInteractions());

/** A post's like/repost state and counts, with this session's changes applied. */
export function usePostState(post: PostView) {
  const override = useInteractions((s) => s.posts[post.uri]);
  const like = override?.like !== undefined ? override.like : (post.viewer?.like ?? null);
  const repost = override?.repost !== undefined ? override.repost : (post.viewer?.repost ?? null);
  return {
    liked: !!like,
    likeCount: override?.likeCount ?? post.likeCount ?? 0,
    reposted: !!repost,
    repostCount: override?.repostCount ?? post.repostCount ?? 0,
  };
}

export function useIsFollowing(actor: ProfileViewBasic | undefined) {
  const known = useInteractions((s) => (actor ? s.follows[actor.did] : undefined));
  return !!(known !== undefined ? known : actor?.viewer?.following);
}

// MARK: UI

export type ComposeTarget = { replyTo?: PostView; root?: PostView; quote?: PostView } | null;

export type Corners = { topLeading?: number; topTrailing?: number; bottomLeading?: number; bottomTrailing?: number };
export type TabName = "home" | "search" | "notifications" | "profile";

type UI = {
  /** The image viewer: which images, from which thumbnail (its frame in the window, to zoom out of). */
  viewer: { images: ImageView[]; index: number; origin: Frame | null; radius: Corners; id: number } | null;
  drawerOpen: boolean;
  /** The drawer is being dragged in from the edge (shown, not yet open). */
  drawerPeek: boolean;
  tab: TabName;
  compose: ComposeTarget | undefined;
  signIn: string | null;
  toast: { id: number; text: string; icon: string } | null;
  openImages(images: ImageView[], index: number, origin?: Frame | null, radius?: Corners): void;
  setDrawerOpen(open: boolean): void;
  setDrawerPeek(peek: boolean): void;
  setTab(tab: TabName): void;
  closeImages(): void;
  openCompose(target?: ComposeTarget): void;
  closeCompose(): void;
  openSignIn(reason?: string): void;
  closeSignIn(): void;
  showToast(text: string, icon: string): void;
};

const makeUI = () =>
  create<UI>()((set, get) => ({
    viewer: null,
    drawerOpen: false,
    drawerPeek: false,
    tab: "home",
    compose: undefined,
    signIn: null,
    toast: null,
    openImages: (images, index, origin = null, radius = {}) => set({ viewer: { images, index, origin, radius, id: Date.now() } }),
    setDrawerOpen: (drawerOpen) => set({ drawerOpen, drawerPeek: false }),
    setDrawerPeek: (drawerPeek) => set({ drawerPeek }),
    setTab: (tab) => set({ tab, drawerOpen: false }),
    closeImages: () => set({ viewer: null }),
    openCompose: (target = null) => {
      if (!requireSignIn("post")) return;
      set({ compose: target });
    },
    closeCompose: () => set({ compose: undefined }),
    openSignIn: (reason = "") => set({ signIn: reason }),
    closeSignIn: () => set({ signIn: null }),
    showToast: (text, icon) => {
      const id = (get().toast?.id ?? 0) + 1;
      set({ toast: { id, text, icon } });
      setTimeout(() => {
        if (get().toast?.id === id) set({ toast: null });
      }, 2200);
    },
  }));

export const useUI: ReturnType<typeof makeUI> = (hot.data.blueskyUI ??= makeUI());

export const toast = (text: string, icon: string) => useUI.getState().showToast(text, icon);

/** True when signed in; otherwise asks the user to sign in (to `reason`) and returns false. */
export function requireSignIn(reason: string): boolean {
  if (useSession.getState().session) return true;
  haptic("warning");
  useUI.getState().openSignIn(reason);
  return false;
}
