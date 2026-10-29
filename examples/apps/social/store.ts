// What the user did, persisted with zustand + localStorage: likes and saves
// (as post snapshots, so the Liked and Saved screens can show them), follows,
// stories seen, and their own comments. Plus a small in-memory UI store for
// the story viewer and comments sheet, which several screens open.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { ME, type Comment, type Post } from "./data";

type Social = {
  likes: Record<string, Post>;
  saves: Record<string, Post>;
  /** Overrides of who you follow (the seed data follows everyone in the feed). */
  following: Record<string, boolean>;
  /** Per user: the ids of the story items you've watched. */
  seen: Record<string, string[]>;
  comments: Record<string, Comment[]>;
  commentLikes: Record<string, true>;

  toggleLike(post: Post): boolean;
  /** Double tap: likes, never unlikes. */
  like(post: Post): void;
  toggleSave(post: Post): boolean;
  toggleFollow(user: string): void;
  markSeen(user: string, item: string): void;
  addComment(postId: string, text: string): Comment;
  toggleCommentLike(id: string): void;
};

const without = <T,>(record: Record<string, T>, key: string) => {
  const next = { ...record };
  delete next[key];
  return next;
};

export const useSocial = create<Social>()(
  persist(
    (set, get) => ({
      likes: {},
      saves: {},
      following: {},
      seen: {},
      comments: {},
      commentLikes: {},

      toggleLike: (post) => {
        const liked = !get().likes[post.id];
        set(({ likes }) => ({ likes: liked ? { ...likes, [post.id]: post } : without(likes, post.id) }));
        return liked;
      },
      like: (post) => {
        if (!get().likes[post.id]) set(({ likes }) => ({ likes: { ...likes, [post.id]: post } }));
      },
      toggleSave: (post) => {
        const saved = !get().saves[post.id];
        set(({ saves }) => ({ saves: saved ? { [post.id]: post, ...saves } : without(saves, post.id) }));
        return saved;
      },
      toggleFollow: (user) => set(({ following }) => ({ following: { ...following, [user]: !(following[user] ?? true) } })),
      markSeen: (user, item) => {
        const list = get().seen[user] ?? [];
        if (!list.includes(item)) set(({ seen }) => ({ seen: { ...seen, [user]: [...list, item] } }));
      },
      addComment: (postId, text) => {
        const comment: Comment = { id: nanoid(), author: ME, text, createdAt: Date.now(), likes: 0 };
        set(({ comments }) => ({ comments: { ...comments, [postId]: [...(comments[postId] ?? []), comment] } }));
        return comment;
      },
      toggleCommentLike: (id) =>
        set(({ commentLikes }) => ({ commentLikes: commentLikes[id] ? without(commentLikes, id) : { ...commentLikes, [id]: true } })),
    }),
    { name: "social-app", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

// Selectors that return primitives (zustand v5 loops on selectors returning new objects).
export const useIsLiked = (id: string) => useSocial((s) => !!s.likes[id]);
export const useIsSaved = (id: string) => useSocial((s) => !!s.saves[id]);
export const useIsFollowing = (user: string) => useSocial((s) => s.following[user] ?? true);
export const useMyCommentCount = (postId: string) => useSocial((s) => s.comments[postId]?.length ?? 0);

// MARK: UI

export type Viewer = { users: string[]; index: number };

type UI = {
  /** The story viewer: whose stories, in order, and where it starts. */
  viewer: Viewer | null;
  openStories(users: string[], index: number): void;
  closeStories(): void;
  /** The post whose comments sheet is up. */
  commentsFor: Post | null;
  openComments(post: Post): void;
  closeComments(): void;
};

export const useUI = create<UI>()((set) => ({
  viewer: null,
  openStories: (users, index) => set({ viewer: { users, index } }),
  closeStories: () => set({ viewer: null }),
  commentsFor: null,
  openComments: (post) => set({ commentsFor: post }),
  closeComments: () => set({ commentsFor: null }),
}));
