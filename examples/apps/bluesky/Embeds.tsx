// What a post can carry: image grids (1–4, with alt text), link cards, quote
// posts, quotes with media, HLS video, feeds/lists, and placeholders for
// posts that are gone or blocked. Labeled media hides behind a warning.
import { useRef, useState, type ReactNode } from "react";
import {
  VStack, HStack, ZStack, Text, Image, Button, Overlay, Video, Spacer, Rectangle, useNavigation, openURL, useNow, format, type HostInstance,
} from "swiftjsx";
import { useUI } from "./store";
import { useSettings } from "./session";
import { displayName, hostOf } from "./format";
import { Avatar, T, ty, useTheme } from "./ui";
import { Verified } from "./PostCell";
import { ThreadScreen } from "./Thread";
import { FeedScreen } from "./FeedScreen";
import type { EmbedRecord, EmbedView, ExternalView, ImageView, MediaView, PostView } from "./types";

const RADIUS = 12;

/** A post's embed, `width` points wide. `compact` inside quotes (smaller media, no nested quotes). */
export function Embed({ embed, width, compact = false }: { embed: EmbedView; width: number; compact?: boolean }) {
  switch (embed.$type) {
    case "app.bsky.embed.images#view":
      return <ImageGrid images={embed.images} width={width} compact={compact} />;
    case "app.bsky.embed.external#view":
      return <LinkCard external={embed.external} width={width} compact={compact} />;
    case "app.bsky.embed.video#view":
      return <VideoEmbed embed={embed} width={width} compact={compact} />;
    case "app.bsky.embed.record#view":
      return compact ? null : <RecordEmbed record={embed.record} width={width} />;
    case "app.bsky.embed.recordWithMedia#view":
      return (
        <VStack spacing={8} alignment="leading">
          <Embed embed={embed.media} width={width} compact={compact} />
          {compact ? null : <RecordEmbed record={embed.record.record} width={width} />}
        </VStack>
      );
    default:
      return null;
  }
}

// MARK: Content labels

const WARNINGS: Record<string, { title: string; icon: string }> = {
  porn: { title: "Adult Content", icon: "eye.slash" },
  sexual: { title: "Sexually Suggestive", icon: "eye.slash" },
  nudity: { title: "Non-sexual Nudity", icon: "eye.slash" },
  "graphic-media": { title: "Graphic Media", icon: "exclamationmark.triangle" },
  gore: { title: "Graphic Media", icon: "exclamationmark.triangle" },
  "!warn": { title: "Content Warning", icon: "exclamationmark.circle" },
};

/** The warning to show over a post's media, from its self-labels or a labeler's. */
export function mediaWarning(post: PostView): { title: string; icon: string } | null {
  for (const label of post.labels ?? []) {
    if (!label.neg && WARNINGS[label.val]) return WARNINGS[label.val];
  }
  return null;
}

/** Bluesky's content hider: a bar with the label and "Show"; the media appears under it once shown. */
export function ContentHider({ warning, width, children }: { warning: { title: string; icon: string }; width: number; children: ReactNode }) {
  const t = useTheme();
  const [shown, setShown] = useState(false);
  return (
    <VStack spacing={8} alignment="leading">
      <Button onPress={() => setShown(!shown)} pressedOpacity={0.7} accessibilityLabel={`${warning.title}. ${shown ? "Hide" : "Show"}`} accessibilityIdentifier="content-warning">
        <HStack spacing={8} padding={{ horizontal: 12, vertical: 11 }} frame={{ width }} background={t.bg50} cornerRadius={8}>
          <Image systemName={warning.icon} font={{ size: 15, weight: "semibold" }} foregroundStyle={t.textMedium} />
          <Text font={ty(T.sm, "semibold")} foregroundStyle={t.text} lineLimit={1}>{warning.title}</Text>
          <Spacer />
          <Text font={ty(T.sm, "semibold")} foregroundStyle={t.primary}>{shown ? "Hide" : "Show"}</Text>
        </HStack>
      </Button>
      {shown ? children : null}
    </VStack>
  );
}

// MARK: Images

/** Height for one image: its own aspect ratio, kept between a square-ish portrait and a wide banner. */
function singleHeight(image: ImageView, width: number, compact: boolean) {
  const ratio = image.aspectRatio ? image.aspectRatio.width / image.aspectRatio.height : 1;
  const height = width / Math.min(Math.max(ratio, compact ? 1 : 0.75), 3);
  return Math.round(height);
}

type Corners = { topLeading?: number; topTrailing?: number; bottomLeading?: number; bottomTrailing?: number };

function ImageGrid({ images, width, compact }: { images: ImageView[]; width: number; compact: boolean }) {
  const gap = compact ? 2 : 4;
  const r = compact ? 8 : RADIUS;
  const cell = (index: number, w: number, h: number, radius: Corners) => (
    <Thumb key={index} images={images} index={index} width={w} height={h} radius={radius} />
  );
  if (images.length === 1) {
    const h = singleHeight(images[0], width, compact);
    return cell(0, width, h, { topLeading: r, topTrailing: r, bottomLeading: r, bottomTrailing: r });
  }
  const half = Math.floor((width - gap) / 2);
  if (images.length === 2) {
    // Bluesky: two squares side by side.
    const h = compact ? half * 0.75 : half;
    return (
      <HStack spacing={gap}>
        {cell(0, half, h, { topLeading: r, bottomLeading: r })}
        {cell(1, half, h, { topTrailing: r, bottomTrailing: r })}
      </HStack>
    );
  }
  if (images.length === 3) {
    const h = compact ? half : Math.round(half * 1.33);
    const small = (h - gap) / 2;
    return (
      <HStack spacing={gap}>
        {cell(0, half, h, { topLeading: r, bottomLeading: r })}
        <VStack spacing={gap}>
          {cell(1, half, small, { topTrailing: r })}
          {cell(2, half, small, { bottomTrailing: r })}
        </VStack>
      </HStack>
    );
  }
  const h = compact ? half * 0.6 : Math.round(half * 0.75);
  return (
    <VStack spacing={gap}>
      <HStack spacing={gap}>
        {cell(0, half, h, { topLeading: r })}
        {cell(1, half, h, { topTrailing: r })}
      </HStack>
      <HStack spacing={gap}>
        {cell(2, half, h, { bottomLeading: r })}
        {cell(3, half, h, { bottomTrailing: r })}
      </HStack>
    </VStack>
  );
}

function Thumb({ images, index, width, height, radius }: { images: ImageView[]; index: number; width: number; height: number; radius: Corners }) {
  const t = useTheme();
  const open = useUI((s) => s.openImages);
  const ref = useRef<HostInstance>(null);
  const image = images[index];
  const total = images.length;
  const label = image.alt ? `Image: ${image.alt}` : total > 1 ? `Image ${index + 1} of ${total}` : "Image";
  // Measured on tap, so the viewer can zoom out of this thumbnail.
  const press = () => {
    const node = ref.current;
    if (!node) return open(images, index, null, radius);
    node.measure().then(
      (frame) => open(images, index, frame, radius),
      () => open(images, index, null, radius),
    );
  };
  return (
    <Button onPress={press} pressedOpacity={0.85} accessibilityLabel={label} accessibilityHint="Opens the image full screen" accessibilityIdentifier="post-image">
      <Image ref={ref} src={image.thumb} contentMode="fill" frame={{ width, height }} background={t.bg50} cornerRadius={radius} border={{ color: t.border, width: 0.5 }}>
        <Overlay alignment="bottomTrailing">
          {image.alt ? (
            <VStack padding={6} allowsHitTesting={false}>
              <Text font={ty(10, "heavy")} foregroundStyle="white" padding={{ horizontal: 5, vertical: 2 }} background="black/60" cornerRadius={5}>
                ALT
              </Text>
            </VStack>
          ) : null}
        </Overlay>
      </Image>
    </Button>
  );
}

// MARK: Link cards

function LinkCard({ external, width, compact }: { external: ExternalView; width: number; compact: boolean }) {
  const t = useTheme();
  const host = hostOf(external.uri);
  if (host === "media.tenor.com") {
    return (
      <Button onPress={() => openURL(external.uri, { inApp: true })} accessibilityLabel={`GIF: ${external.title}`}>
        <Image src={external.uri} contentMode="fill" frame={{ width, height: Math.round(width * 0.7) }} cornerRadius={RADIUS} background={t.bg50} />
      </Button>
    );
  }
  return (
    <Button onPress={() => openURL(external.uri, { inApp: true })} pressedOpacity={0.8} accessibilityLabel={`Link: ${external.title || host}`} accessibilityHint={host} accessibilityIdentifier="link-card">
      <VStack spacing={0} alignment="leading" frame={{ width }} background={t.bg} cornerRadius={RADIUS} border={{ color: t.border, width: 1 }}>
        {external.thumb && !compact ? (
          <Image src={external.thumb} contentMode="fill" frame={{ width, height: Math.round(width / 1.91) }} background={t.bg50} />
        ) : null}
        <VStack alignment="leading" spacing={3} padding={{ horizontal: 12, top: 10, bottom: 10 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          {external.title ? <Text font={ty(T.md, "semibold")} foregroundStyle={t.text} lineLimit={3}>{external.title}</Text> : null}
          {external.description && !compact ? (
            <Text font={ty(13)} foregroundStyle={t.textMedium} lineLimit={external.thumb ? 2 : 4}>{external.description}</Text>
          ) : null}
        </VStack>
        <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 1 }} padding={{ horizontal: 12 }} />
        <HStack spacing={5} padding={{ horizontal: 12, vertical: 8 }}>
          <Image systemName="globe" font={{ size: 11, weight: "medium" }} foregroundStyle={t.textMedium} />
          <Text font={ty(T.xs)} foregroundStyle={t.textMedium} lineLimit={1}>{host}</Text>
        </HStack>
      </VStack>
    </Button>
  );
}

// MARK: Video

function VideoEmbed({ embed, width, compact }: { embed: Extract<MediaView, { $type: "app.bsky.embed.video#view" }>; width: number; compact: boolean }) {
  const autoplay = useSettings((s) => s.autoplayVideos);
  const t = useTheme();
  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const ratio = embed.aspectRatio ? embed.aspectRatio.width / embed.aspectRatio.height : 16 / 9;
  const height = Math.round(width / Math.min(Math.max(ratio, compact ? 1 : 0.8), 2));
  if (playing || (autoplay && !compact)) {
    return (
      <Video
        src={embed.playlist}
        autoPlay
        // Rows are rendered ahead of the scroll position: only play while on screen.
        playsWhenVisible
        poster={embed.thumbnail}
        muted={!playing}
        loop={!playing}
        controls={playing}
        contentMode="fit"
        frame={{ width, height }}
        background="black"
        cornerRadius={RADIUS}
        border={{ color: t.border, width: 0.5 }}
        onTimeUpdate={({ currentTime, duration }) => {
          if (!playing) setRemaining(Math.max(0, Math.round(duration - currentTime)));
        }}
        accessibilityLabel={embed.alt ? `Video: ${embed.alt}` : "Video"}
        accessibilityIdentifier="post-video"
      >
        {!playing ? (
          <Overlay alignment="bottom">
            <HStack padding={8} allowsHitTesting={!playing}>
              {remaining !== null ? (
                <Text font={ty(T.xs, "semibold")} foregroundStyle="white" monospacedDigit padding={{ horizontal: 7, vertical: 3 }} background="black/55" cornerRadius={6}>
                  {`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
                </Text>
              ) : null}
              <Spacer />
              <Button onPress={() => setPlaying(true)} accessibilityLabel="Unmute">
                <Image systemName="speaker.slash.fill" font={{ size: 12 }} foregroundStyle="white" frame={{ width: 28, height: 28 }} background="black/55" cornerRadius="capsule" />
              </Button>
            </HStack>
          </Overlay>
        ) : null}
      </Video>
    );
  }
  return (
    <Button onPress={() => setPlaying(true)} pressedOpacity={0.85} accessibilityLabel={embed.alt ? `Play video: ${embed.alt}` : "Play video"} accessibilityIdentifier="post-video">
      <ZStack frame={{ width, height }} background="black" cornerRadius={RADIUS}>
        {embed.thumbnail ? <Image src={embed.thumbnail} contentMode="fill" frame={{ width, height }} /> : null}
        <Image systemName="play.fill" font={{ size: 22 }} foregroundStyle="white" frame={{ width: 52, height: 52 }} background="ultraThinMaterial" cornerRadius="capsule" colorScheme="dark" offset={{ x: 0 }} />
      </ZStack>
    </Button>
  );
}

// MARK: Records

function RecordEmbed({ record, width }: { record: EmbedRecord; width: number }) {
  switch (record.$type) {
    case "app.bsky.embed.record#viewRecord":
      return <QuotePost record={record} width={width} />;
    case "app.bsky.embed.record#viewNotFound":
      return <Placeholder icon="trash" text="Deleted" width={width} />;
    case "app.bsky.embed.record#viewBlocked":
      return <Placeholder icon="person.crop.circle.badge.xmark" text="Blocked" width={width} />;
    case "app.bsky.embed.record#viewDetached":
      return <Placeholder icon="eye.slash" text="Removed by author" width={width} />;
    case "app.bsky.feed.defs#generatorView":
      return <FeedCard uri={record.uri} title={record.displayName} subtitle={`Feed by @${record.creator.handle}`} avatar={record.avatar} width={width} />;
    case "app.bsky.graph.defs#listView":
      return <FeedCard title={record.name} subtitle={`List by @${record.creator.handle}`} avatar={record.avatar} width={width} />;
    case "app.bsky.graph.defs#starterPackViewBasic":
      return <FeedCard title={record.record.name ?? "Starter pack"} subtitle={`Starter pack by @${record.creator.handle}`} width={width} />;
    case "app.bsky.labeler.defs#labelerView":
      return <FeedCard title={displayName(record.creator)} subtitle="Labeler" avatar={record.creator.avatar} width={width} />;
    default:
      return null;
  }
}

function QuotePost({ record, width }: { record: Extract<EmbedRecord, { $type: "app.bsky.embed.record#viewRecord" }>; width: number }) {
  const nav = useNavigation();
  const now = useNow();
  const t = useTheme();
  const media = record.embeds?.[0];
  const inner = width - 24;
  // A quote is a whole post for the thread screen: rebuild the PostView from the view record.
  const post: PostView = {
    uri: record.uri,
    cid: record.cid,
    author: record.author,
    record: record.value,
    embed: media,
    indexedAt: record.indexedAt,
    likeCount: record.likeCount,
    replyCount: record.replyCount,
    repostCount: record.repostCount,
    quoteCount: record.quoteCount,
  };
  return (
    <Button onPress={() => nav.push(<ThreadScreen uri={record.uri} initial={post} />)} pressedOpacity={0.8} accessibilityIdentifier="quote-post">
      <VStack alignment="leading" spacing={5} padding={{ horizontal: 12, top: 10, bottom: 12 }} frame={{ width, alignment: "leading" }} background={t.bg} cornerRadius={RADIUS} border={{ color: t.border, width: 1 }}>
        <HStack spacing={0}>
          <Avatar uri={record.author.avatar} size={16} />
          <Text font={ty(T.md, "bold")} foregroundStyle={t.text} lineLimit={1} layoutPriority={1} padding={{ leading: 6 }}>{displayName(record.author)}</Text>
          {record.author.verification?.verifiedStatus === "valid" ? (
            <HStack padding={{ leading: 3 }}>
              <Verified size={12} />
            </HStack>
          ) : null}
          <Text font={ty(T.md)} foregroundStyle={t.textMedium} lineLimit={1} padding={{ leading: 4 }}>@{record.author.handle}</Text>
          <Text font={ty(T.md)} foregroundStyle={t.textMedium} fixedSize padding={{ leading: 4 }}>{`· ${format.relativeTime(Date.parse(record.value.createdAt ?? record.indexedAt), { now })}`}</Text>
          <Spacer minLength={0} />
        </HStack>
        {record.value.text ? <Text font={ty(T.md)} foregroundStyle={t.text} lineSpacing={2} lineLimit={20}>{record.value.text}</Text> : null}
        {media && media.$type !== "app.bsky.embed.record#view" ? (
          <VStack padding={{ top: 4 }}>
            <Embed embed={media} width={inner} compact />
          </VStack>
        ) : null}
      </VStack>
    </Button>
  );
}

function FeedCard({ uri, title, subtitle, avatar, width }: { uri?: string; title: string; subtitle: string; avatar?: string; width: number }) {
  const nav = useNavigation();
  const t = useTheme();
  return (
    <Button onPress={() => uri && nav.push(<FeedScreen uri={uri} title={title} />)} pressedOpacity={0.8} disabled={!uri}>
      <HStack spacing={10} padding={12} frame={{ width, alignment: "leading" }} background={t.bg} cornerRadius={RADIUS} border={{ color: t.border, width: 1 }}>
        <Avatar uri={avatar} size={36} square />
        <VStack alignment="leading" spacing={2}>
          <Text font={ty(T.md, "bold")} foregroundStyle={t.text} lineLimit={1}>{title}</Text>
          <Text font={ty(13)} foregroundStyle={t.textMedium} lineLimit={1}>{subtitle}</Text>
        </VStack>
        <Spacer />
      </HStack>
    </Button>
  );
}

function Placeholder({ icon, text, width }: { icon: string; text: string; width: number }) {
  const t = useTheme();
  return (
    <HStack spacing={8} padding={{ horizontal: 12, vertical: 12 }} frame={{ width, alignment: "leading" }} background={t.bg25} cornerRadius={RADIUS} border={{ color: t.border, width: 1 }}>
      <Image systemName={icon} font={{ size: 14 }} foregroundStyle={t.textMedium} />
      <Text font={ty(T.sm)} foregroundStyle={t.textMedium}>{text}</Text>
    </HStack>
  );
}
