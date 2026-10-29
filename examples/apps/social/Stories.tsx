// The stories row (avatar rings, unseen first) and the full-screen viewer:
// progress bars that advance on a timer, tap left / right to go back / on,
// hold to pause, swipe sideways to skip a person, swipe down to close.
import { useEffect, useReducer, useRef, useState } from "react";
import {
  ScrollView, VStack, HStack, ZStack, Text, Image, Button, Spacer, Divider, ProgressView, TextField, Sheet, PageIndicator,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, haptic, useNow, toast, format, type HostInstance,
} from "swiftjsx";
import { ME, storyURL, user as getUser, type Story } from "./data";
import { useSocial, useUI } from "./store";
import { Avatar, Verified, useStories } from "./ui";

const watchedAll = (story: Story, seen: Record<string, string[]>) => story.items.every((item) => (seen[story.user] ?? []).includes(item.id));

// MARK: Row

export function StoriesRow() {
  const stories = useStories();
  const seen = useSocial((s) => s.seen);
  const open = useUI((s) => s.openStories);
  // Yours first, then the ones you haven't watched.
  const [mine, ...rest] = stories;
  const ordered = [mine, ...rest.filter((s) => !watchedAll(s, seen)), ...rest.filter((s) => watchedAll(s, seen))].filter(Boolean);

  return (
    <VStack spacing={0}>
      <ScrollView axis="horizontal" showsIndicators={false} spacing={14} contentMargins={{ horizontal: 12 }} padding={{ vertical: 10 }} animation="snappy">
        {ordered.map((story, i) => {
          const unseen = !watchedAll(story, seen);
          const name = story.user === ME ? "Your story" : story.user;
          return (
            <Button
              key={story.user}
              buttonStyle="plain"
              pressedScale={0.92}
              onPress={() => open(ordered.map((s) => s.user), i)}
              accessibilityIdentifier="story"
              accessibilityLabel={`${name}${unseen ? ", new" : ""}`}
            >
              <VStack spacing={5}>
                <Avatar user={story.user} size={66} ring={unseen ? "unseen" : "seen"} badge={story.user === ME} />
                <Text font="caption" lineLimit={1} foregroundStyle={unseen ? "label" : "secondaryLabel"} frame={{ width: 76 }}>
                  {name}
                </Text>
              </VStack>
            </Button>
          );
        })}
      </ScrollView>
      <Divider />
    </VStack>
  );
}

// MARK: Viewer

export function StoryViewer() {
  const viewer = useUI((s) => s.viewer);
  const close = useUI((s) => s.closeStories);
  return (
    <Sheet item={viewer} onDismiss={close} fullScreen background="clear">
      {(v) => <StoryPlayer users={v.users} start={v.index} onClose={close} />}
    </Sheet>
  );
}

/** Seconds per story. */
const DURATION = 5;
/** Progress timer interval, ms (there's no requestAnimationFrame). */
const TICK = 50;
/** Held longer than this (ms), a touch pauses instead of tapping. */
const HOLD = 220;

/** `run` counts moves, so going "back" from the very first story restarts it. */
type Position = { user: number; item: number; done: boolean; run: number };
/** Per user: how many items, and which one to start at (the first unseen). */
type Meta = { counts: number[]; starts: number[] };
type Action = { type: "next" | "back" | "nextUser" | "prevUser"; meta: Meta };

function toUser(state: Position, user: number, meta: Meta, item = meta.starts[user]): Position {
  if (user < 0) return state;
  if (user >= meta.counts.length) return { ...state, done: true };
  return { ...state, user, item, done: false };
}

function reduce(state: Position, action: Action): Position {
  return state.done ? state : { ...move(state, action), run: state.run + 1 };
}

function move(state: Position, { type, meta }: Action): Position {
  switch (type) {
    case "next":
      return state.item + 1 < meta.counts[state.user] ? { ...state, item: state.item + 1 } : toUser(state, state.user + 1, meta);
    case "back":
      if (state.item > 0) return { ...state, item: state.item - 1 };
      return toUser(state, state.user - 1, meta, meta.counts[state.user - 1] - 1);
    case "nextUser":
      return toUser(state, state.user + 1, meta);
    case "prevUser":
      return toUser(state, state.user - 1, meta, 0);
  }
}

function StoryPlayer({ users, start, onClose }: { users: string[]; start: number; onClose(): void }) {
  const all = useStories();
  const seen = useSocial((s) => s.seen);
  const markSeen = useSocial((s) => s.markSeen);
  const stories = users.map((id) => all.find((s) => s.user === id)).filter((s): s is Story => !!s);
  const counts = stories.map((s) => s.items.length);
  // Where each person's stories start: the first one you haven't watched
  // (or the first, if you've seen them all).
  const starts = stories.map((s) => Math.max(0, s.items.findIndex((item) => !(seen[s.user] ?? []).includes(item.id))));
  const meta: Meta = { counts, starts };

  const [position, dispatch] = useReducer(reduce, null, () => ({ user: start, item: starts[start] ?? 0, done: false, run: 0 }));
  const story = stories[position.user];
  const item = story?.items[position.item];
  const author = getUser(story?.user ?? ME);

  const [touching, setTouching] = useState(false);
  const [typing, setTyping] = useState(false);
  const [reply, setReply] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loaded = !!item && loadedId === item.id;
  const playing = loaded && !touching && !typing && !position.done;
  const input = useRef<HostInstance>(null);
  // Blurring goes through an effect: `release` is called from a worklet, and
  // the React Compiler skips a component whose worklet captures a function
  // that reads a ref.
  const [blurs, setBlurs] = useState(0);
  useEffect(() => {
    if (blurs) input.current?.blur();
  }, [blurs]);
  const now = useNow();

  useEffect(() => {
    if (loaded && story && item) markSeen(story.user, item.id);
  }, [loaded, story, item, markSeen]);

  useEffect(() => {
    if (position.done) onClose();
  }, [position.done, onClose]);

  // MARK: Gestures (main thread)

  const drag = useSharedValue({ x: 0, y: 0 });
  const down = useSharedValue(false);
  const pressedAt = useSharedValue(0);
  // The header and reply bar fade while you hold (after HOLD ms), all on the
  // main thread: a delayed timing that a quick release simply retargets.
  const chrome = useSharedValue(1);
  const follow = useAnimatedStyle(() => {
    const y = Math.max(0, drag.get().y);
    return { offset: { x: 0, y }, scale: 1 - Math.min(y / 1600, 0.12) };
  });
  const dim = useAnimatedStyle(() => ({ opacity: 1 - Math.min(Math.max(0, drag.get().y) / 500, 0.85) }));
  const chromeStyle = useAnimatedStyle(() => ({ opacity: chrome.get() }));

  const release = (x: number, width: number, dx: number, dy: number, held: number) => {
    setTouching(false);
    if (typing) {
      // A tap on the story while replying just puts the keyboard away.
      setBlurs((n) => n + 1);
      return;
    }
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      haptic("selection");
      dispatch({ type: dx < 0 ? "nextUser" : "prevUser", meta });
    } else if (held < HOLD && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      dispatch({ type: x < width / 3 ? "back" : "next", meta });
    }
  };
  const dismiss = () => setTimeout(onClose, 160);

  if (!story || !item) return null;

  return (
    <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} accessibilityIdentifier="story-viewer" accessibilityElement="contain">
      {/* A square background extends under the safe areas; the content doesn't. */}
      <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background="black" animatedStyle={dim} />
      <VStack spacing={8} animatedStyle={follow} colorScheme="dark">
        <ZStack
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          background="#111"
          cornerRadius={12}
          dragMinimumDistance={0}
          onDrag={(e) => {
            "worklet";
            if (!down.get()) {
              down.set(true);
              pressedAt.set(Date.now());
              chrome.set(withTiming(0, { duration: 0.2, delay: HOLD / 1000 }));
              runOnJS(setTouching)(true);
            }
            drag.set({ x: e.translation.x, y: e.translation.y });
          }}
          onDragEnd={(e) => {
            "worklet";
            down.set(false);
            chrome.set(withTiming(1, { duration: 0.15 }));
            const t = e.translation;
            if (t.y > 140 || (t.y > 40 && e.predictedEndTranslation.y > 450)) {
              drag.set(withTiming({ x: 0, y: 1100 }, { duration: 0.22, easing: "easeIn" }));
              runOnJS(dismiss)();
              return;
            }
            drag.set(withSpring({ x: 0, y: 0 }, { duration: 0.3, bounce: 0.2 }));
            runOnJS(release)(e.localStartLocation.x, e.size.width, t.x, t.y, Date.now() - pressedAt.get());
          }}
          accessibilityLabel={`Story by ${story.user}, ${position.item + 1} of ${story.items.length}`}
          accessibilityHint="Tap the right side for the next story, the left side for the previous one"
        >
          <Image key={item.id} src={storyURL(item.photo)} contentMode="fill" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} onLoad={() => setLoadedId(item.id)} onError={() => setLoadedId(item.id)} transition="opacity" />
          {!loaded ? <ProgressView tint="white" /> : null}
          <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "top" }} allowsHitTesting={false}>
            <VStack frame={{ maxWidth: "infinity", height: 130 }} background={{ gradient: ["black/55", "clear"] }} />
          </VStack>
          <VStack spacing={10} padding={{ horizontal: 10, top: 10 }} frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "top" }} animatedStyle={chromeStyle}>
            {/* Keyed per item: the timer (and its progress) start over. */}
            <Bars
              key={position.run}
              count={story.items.length}
              index={position.item}
              playing={playing}
              onDone={() => dispatch({ type: "next", meta })}
            />
            <HStack spacing={8}>
              <Avatar user={story.user} size={32} />
              <Text font="subheadline" fontWeight="semibold" foregroundStyle="white">{story.user === ME ? "Your story" : story.user}</Text>
              {author.verified ? <Verified /> : null}
              <Text font="subheadline" foregroundStyle="white/70">{format.relativeTime(item.createdAt, { now })}</Text>
              <Spacer />
              <Button onPress={onClose} accessibilityLabel="Close" accessibilityIdentifier="close-story" padding={6}>
                <Image systemName="xmark" font="title3" fontWeight="semibold" foregroundStyle="white" />
              </Button>
            </HStack>
          </VStack>
        </ZStack>
        <HStack spacing={12} padding={{ horizontal: 12, bottom: 4 }} animatedStyle={chromeStyle}>
          <TextField
            ref={input}
            value={reply}
            onChange={setReply}
            placeholder={story.user === ME ? "Add a message…" : `Reply to ${story.user}…`}
            textFieldStyle="plain"
            submitLabel="send"
            onFocus={() => setTyping(true)}
            onBlur={() => setTyping(false)}
            onSubmit={() => {
              if (reply.trim()) toast(`Sent to ${story.user}`, { systemImage: "paperplane.fill" });
              setReply("");
            }}
            padding={{ horizontal: 16, vertical: 11 }}
            border={{ color: "white/60", width: 1 }}
            cornerRadius="capsule"
            foregroundStyle="white"
            accessibilityIdentifier="story-reply"
          />
          <Button onPress={() => toast("Liked", { systemImage: "heart.fill" })} accessibilityLabel="Like story">
            <Image systemName="heart" font="title2" foregroundStyle="white" />
          </Button>
          <Button onPress={() => navigator.clipboard.writeText(`https://social.example/stories/${story.user}`).then(() => toast("Link copied", { systemImage: "link" }))} accessibilityLabel="Share story">
            <Image systemName="paperplane" font="title2" foregroundStyle="white" />
          </Button>
        </HStack>
      </VStack>
    </ZStack>
  );
}

/**
 * One bar per item: watched ones full, the current one filling. The timer
 * lives here, so its ticks re-render only the bars, not the viewer (whose
 * gesture worklets would be re-sent to the main thread on every render).
 */
function Bars({ count, index, playing, onDone }: { count: number; index: number; playing: boolean; onDone(): void }) {
  const [progress, setProgress] = useState(0);
  const finished = useRef(false);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setProgress((p) => Math.min(1, p + TICK / 1000 / DURATION)), TICK);
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    if (progress < 1 || finished.current) return;
    finished.current = true;
    onDone();
  }, [progress, onDone]);

  return (
    <PageIndicator
      style="segments"
      dotSize={2.5}
      count={count}
      page={index}
      progress={progress}
      // Smooth between timer ticks.
      animation={{ type: "linear", duration: TICK / 1000 }}
      frame={{ maxWidth: "infinity" }}
      accessibilityHidden
    />
  );
}
