// Fake but deterministic content: users, posts, comments and stories, all
// generated from seeded random numbers so the same id always gives the same
// post (saved and liked posts survive relaunches as ids plus snapshots).
// Photos come from picsum.photos by id.

export type User = {
  id: string;
  name: string;
  avatar: number;
  bio: string;
  verified?: boolean;
  followers: number;
  following: number;
  link?: string;
};

export type Post = {
  id: string;
  author: string;
  photos: number[];
  caption: string;
  location?: string;
  likes: number;
  comments: number;
  createdAt: number;
  /** Someone you follow who liked it ("Liked by …"). */
  likedBy?: string;
};

export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  likes: number;
};

export type StoryItem = { id: string; photo: number; createdAt: number };
export type Story = { user: string; items: StoryItem[] };

// MARK: Random

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: a small seeded generator. */
export function random(seed: string) {
  let a = hash(seed);
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)],
    chance: (p: number) => next() < p,
  };
}

// MARK: Photos

// picsum ids that don't exist (404).
const missing = new Set([
  86, 97, 105, 138, 148, 150, 205, 207, 224, 226, 245, 246, 262, 285, 286, 298, 303, 332, 333, 346, 359, 394, 414,
  422, 438, 462, 463, 470, 489, 540, 561, 578, 587, 589, 592, 595, 597, 601, 624, 632, 636, 644, 647, 673, 697, 706,
  707, 708, 709, 710, 711, 712, 713, 714, 720, 725, 734, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 759, 761,
  762, 763, 771, 792, 801, 812, 843, 850, 854, 895, 897, 899, 917, 920, 934, 956, 963, 968, 1007, 1017, 1030, 1034,
  1046,
]);
const photoIds = Array.from({ length: 1085 }, (_, i) => i).filter((i) => !missing.has(i));

export const photoURL = (id: number, size = 800) => `https://picsum.photos/id/${id}/${size}/${size}`;
export const storyURL = (id: number) => `https://picsum.photos/id/${id}/720/1280`;
export const avatarURL = (user: User) => `https://picsum.photos/id/${user.avatar}/200/200`;

// MARK: Users

export const ME = "jsx.native";

const userList: User[] = [
  { id: ME, name: "You", avatar: 64, bio: "Building SwiftUI apps with React.\nThis is your profile 👋", followers: 412, following: 389, link: "github.com/swiftjsx" },
  { id: "maya.lens", name: "Maya Okafor", avatar: 65, bio: "Film & light. 35mm forever 🎞️\nLagos → Lisbon", followers: 48210, following: 612, verified: true, link: "mayaokafor.photo" },
  { id: "theo_outdoors", name: "Theo Brandt", avatar: 91, bio: "Trail runner. Coffee snob. Mountains > beaches", followers: 9312, following: 811 },
  { id: "noodle.diaries", name: "Hana Sato", avatar: 177, bio: "Eating my way through Tokyo 🍜", followers: 120400, following: 230, verified: true },
  { id: "archi.daily", name: "Arch Daily-ish", avatar: 338, bio: "Lines, light, concrete.", followers: 2_300_000, following: 12, verified: true },
  { id: "lucas.makes", name: "Lucas Ferreira", avatar: 342, bio: "Woodworker. Dad. Bad at Instagram.", followers: 1840, following: 402 },
  { id: "priya.travels", name: "Priya Raman", avatar: 399, bio: "47 countries and counting ✈️ #wanderlust", followers: 77800, following: 1201 },
  { id: "sam_codes", name: "Sam Whitaker", avatar: 433, bio: "Swift by day, sourdough by night", followers: 3120, following: 287 },
  { id: "elena.v", name: "Elena Vasquez", avatar: 447, bio: "Painter. Plants. Quiet mornings.", followers: 15600, following: 940 },
  { id: "kofi.frames", name: "Kofi Mensah", avatar: 453, bio: "Street photography · Accra", followers: 22900, following: 350 },
  { id: "jules.bakes", name: "Jules Martin", avatar: 473, bio: "Croissants are a love language 🥐", followers: 8800, following: 500 },
  { id: "nora.north", name: "Nora Lindqvist", avatar: 494, bio: "Chasing auroras in Tromsø", followers: 31400, following: 199 },
  { id: "dev.dan", name: "Dan Kim", avatar: 509, bio: "Mechanical keyboards & synths", followers: 1290, following: 610 },
  { id: "wild.ines", name: "Inês Costa", avatar: 531, bio: "Wildlife biologist 🦉", followers: 5400, following: 330 },
  { id: "cityscapes", name: "City Scapes", avatar: 550, bio: "The world's skylines, daily.", followers: 940000, following: 3, verified: true },
  { id: "omar.eats", name: "Omar Haddad", avatar: 593, bio: "Home cook. Spice hoarder.", followers: 6600, following: 720 },
];

export const users: Record<string, User> = Object.fromEntries(userList.map((u) => [u.id, u]));
export const others = userList.filter((u) => u.id !== ME).map((u) => u.id);
export const user = (id: string): User => users[id] ?? users[ME];

// MARK: Captions

const tags = [
  "travel", "photography", "nature", "sunset", "coffee", "citylife", "weekend", "mood", "explore", "film",
  "architecture", "wanderlust", "minimal", "streetphotography", "goldenhour", "foodie", "mountains", "ocean",
];
const locations = [
  "Lisbon, Portugal", "Yosemite National Park", "Shibuya, Tokyo", "Brooklyn, New York", "Reykjavík, Iceland",
  "Marrakech, Morocco", "Cape Town", "Kyoto, Japan", "Amalfi Coast", "Banff National Park", "Mexico City", "Copenhagen",
];
const captions = [
  "Golden hour never misses ☀️ with {@} {#} {#}",
  "Some days you just have to stop and look up. {#}",
  "Weekend reset 🌿",
  "Shot this on a whim walking home last night and I think it's my favorite photo of the year. Funny how that works: you plan a whole trip around one view and the best frame is the one you almost didn't take. Thanks {@} for waiting while I fumbled with the settings 😅 {#} {#} {#}",
  "Can't stop thinking about this place. Who's been? {#} {#}",
  "Throwback to the best coffee of my life ☕️ {#}",
  "New series dropping this week. Here's a sneak peek 👀 Shot with {@} over three foggy mornings, mostly waiting for the light to do something interesting. It did, eventually. {#} {#}",
  "Swipe for the before → after ✨",
  "{@} said 'one more hike' four hours ago 🥲 {#} {#}",
  "Quiet corners {#}",
  "Dinner tonight: improvised, a little burnt, absolutely perfect. Recipe in the comments if {@} stops eating long enough to type it out 😂 {#} {#}",
  "Blue hour > golden hour. Fight me. {#} {#}",
];

function caption(rng: ReturnType<typeof random>, author: string) {
  return rng
    .pick(captions)
    .replace(/\{@\}/g, () => "@" + rng.pick(others.filter((u) => u !== author)))
    .replace(/\{#\}/g, () => "#" + rng.pick(tags));
}

// MARK: Posts

const HOUR = 3_600_000;

/** A post, the same every time for the same id and time. */
export function makePost(id: string, createdAt: number, author?: string): Post {
  const rng = random("post:" + id);
  const by = author ?? rng.pick(others);
  const count = rng.chance(0.55) ? 1 : rng.int(2, 5);
  const photos = Array.from({ length: count }, () => rng.pick(photoIds));
  const popular = rng.chance(0.15);
  return {
    id,
    author: by,
    photos,
    caption: caption(rng, by),
    location: rng.chance(0.6) ? rng.pick(locations) : undefined,
    likes: popular ? rng.int(10_000, 250_000) : rng.int(3, 4_000),
    comments: rng.int(0, popular ? 900 : 60),
    createdAt,
    likedBy: rng.chance(0.6) ? rng.pick(others.filter((u) => u !== by)) : undefined,
  };
}

/** The n-th post of the home feed, `epoch` being when the feed was opened. */
export function feedPost(n: number, epoch: number): Post {
  const rng = random("age:" + n);
  return makePost("p" + n, epoch - n * 2.3 * HOUR - rng.next() * 1.5 * HOUR - 4 * 60_000);
}

/** New posts that "arrived" on a pull to refresh. */
export function freshPost(k: number, now: number): Post {
  return makePost("new" + k, now - random("fresh:" + k).int(1, 9) * 60_000);
}

/** The n-th post on someone's profile grid (newest first). */
export function profilePost(userId: string, n: number, epoch: number): Post {
  const rng = random(`age:${userId}:${n}`);
  return makePost(`${userId}:${n}`, epoch - n * 26 * HOUR - rng.next() * 20 * HOUR, userId);
}

/** How many posts a profile has. */
export const postCount = (userId: string) => (userId === ME ? 14 : 24 + (random("count:" + userId).int(0, 400)));

export function explorePost(n: number, epoch: number): Post {
  return makePost("x" + n, epoch - random("xage:" + n).int(1, 24 * 14) * HOUR);
}

// MARK: Comments

const commentTexts = [
  "This is stunning 😍", "Wow 🔥🔥🔥", "Okay this is my new wallpaper", "Where is this?? Need to go",
  "The colors!!", "@{@} we have to go here", "Absolutely love this", "Goals 🙌", "How do you always find these spots",
  "🙌🙌", "Frame-worthy. Seriously.", "I was just there last month! {#}", "That light though ✨", "Take me back 😭",
  "Not you making the rest of us look bad 😂", "Saving this for my next trip", "Teach me your ways",
];

/** The post's comments, oldest first. */
export function postComments(post: Post): Comment[] {
  const rng = random("comments:" + post.id);
  const shown = Math.min(post.comments, 30);
  const span = Math.max(Date.now() - post.createdAt, 60_000);
  return Array.from({ length: shown }, (_, i) => {
    const author = rng.pick(others.filter((u) => u !== post.author));
    return {
      id: `${post.id}/c${i}`,
      author,
      text: rng
        .pick(commentTexts)
        .replace("{@}", rng.pick(others))
        .replace("{#}", "#" + rng.pick(tags)),
      createdAt: post.createdAt + (span * (i + rng.next())) / (shown + 1),
      likes: rng.chance(0.5) ? rng.int(1, 300) : 0,
    };
  });
}

// MARK: Stories

/** Users with stories, in a stable order, plus your own (first). */
export function makeStories(epoch: number): Story[] {
  const withStories = [ME, ...others.filter((id) => random("hasStory:" + id).chance(0.7))];
  return withStories.map((id) => {
    const rng = random("story:" + id);
    const count = id === ME ? 1 : rng.int(1, 4);
    return {
      user: id,
      items: Array.from({ length: count }, (_, i) => ({
        id: `${id}/s${i}`,
        photo: rng.pick(photoIds),
        createdAt: epoch - (count - i) * rng.int(20, 180) * 60_000,
      })),
    };
  });
}
