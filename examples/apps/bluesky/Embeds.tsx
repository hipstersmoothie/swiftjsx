// What a post can carry: image grids (1–4, with alt text), link cards, quote
// posts, quotes with media, HLS video, feeds/lists, and placeholders for
// posts that are gone or blocked.
import { useState } from "react";
import {
  VStack, HStack, ZStack, Text, Image, Button, Overlay, Video, Spacer, useNavigation, openURL,
} from "swiftjsx";
import { useUI } from "./store";
import { useSettings } from "./session";
import { ago, displayName, hostOf } from "./format";
import { Avatar, cardBackground, hairline, subtle, useNow } from "./ui";
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

// MARK: Images

/** Height for one image: its own aspect ratio, kept between a wide banner and a tall portrait. */
function singleHeight(image: ImageView, width: number, compact: boolean) {
  const ratio = image.aspectRatio ? image.aspectRatio.width / image.aspectRatio.height : 1;
  const height = width / Math.min(Math.max(ratio, compact ? 1 : 0.75), 3);
  return Math.round(height);
}

function ImageGrid({ images, width, compact }: { images: ImageView[]; width: number; compact: boolean }) {
  const open = useUI((s) => s.openImages);
  const gap = 4;
  const cell = (index: number, w: number, h: number, radius: { topLeading?: number; topTrailing?: number; bottomLeading?: number; bottomTrailing?: number }) => (
    <Thumb key={index} image={images[index]} index={index} total={images.length} width={w} height={h} radius={radius} onPress={() => open(images, index)} />
  );
  const r = RADIUS;
  if (images.length === 1) {
    const image = images[0];
    const h = singleHeight(image, width, compact);
    return cell(0, width, h, { topLeading: r, topTrailing: r, bottomLeading: r, bottomTrailing: r });
  }
  const half = (width - gap) / 2;
  if (images.length === 2) {
    const h = compact ? half * 0.75 : half * 1.2;
    return (
      <HStack spacing={gap}>
        {cell(0, half, h, { topLeading: r, bottomLeading: r })}
        {cell(1, half, h, { topTrailing: r, bottomTrailing: r })}
      </HStack>
    );
  }
  if (images.length === 3) {
    const h = compact ? half : half * 1.3;
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
  const h = compact ? half * 0.6 : half * 0.75;
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

function Thumb({
  image, index, total, width, height, radius, onPress,
}: {
  image: ImageView;
  index: number;
  total: number;
  width: number;
  height: number;
  radius: { topLeading?: number; topTrailing?: number; bottomLeading?: number; bottomTrailing?: number };
  onPress(): void;
}) {
  const label = image.alt ? `Image: ${image.alt}` : total > 1 ? `Image ${index + 1} of ${total}` : "Image";
  return (
    <Button onPress={onPress} pressedOpacity={0.85} accessibilityLabel={label} accessibilityHint="Opens the image full screen" accessibilityIdentifier="post-image">
      <Image src={image.thumb} contentMode="fill" frame={{ width, height }} background={cardBackground} cornerRadius={radius} border={{ color: hairline, width: 0.5 }}>
        <Overlay alignment="bottomLeading">
          {image.alt ? (
            <VStack padding={6} allowsHitTesting={false}>
              <Text font={{ size: 10, weight: "bold" }} foregroundStyle="white" padding={{ horizontal: 5, vertical: 2 }} background="black/60" cornerRadius={4}>
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
  const host = hostOf(external.uri);
  const isGif = host === "media.tenor.com";
  if (isGif) {
    return (
      <Button onPress={() => openURL(external.uri, { inApp: true })} accessibilityLabel={`GIF: ${external.title}`}>
        <Image src={external.uri} contentMode="fill" frame={{ width, height: width * 0.7 }} cornerRadius={RADIUS} background={cardBackground} />
      </Button>
    );
  }
  return (
    <Button onPress={() => openURL(external.uri, { inApp: true })} pressedOpacity={0.8} accessibilityLabel={`Link: ${external.title || host}`} accessibilityHint={host} accessibilityIdentifier="link-card">
      <VStack spacing={0} alignment="leading" frame={{ width }} cornerRadius={RADIUS} border={{ color: hairline, width: 1 }}>
        {external.thumb && !compact ? (
          <Image src={external.thumb} contentMode="fill" frame={{ width, height: Math.round(width / 1.91) }} background={cardBackground} />
        ) : null}
        <VStack alignment="leading" spacing={3} padding={{ horizontal: 12, vertical: 10 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          {external.title ? <Text font="subheadline" fontWeight="semibold" lineLimit={2}>{external.title}</Text> : null}
          {external.description && !compact ? <Text font="footnote" foregroundStyle={subtle} lineLimit={2}>{external.description}</Text> : null}
          <HStack spacing={4} padding={{ top: 4 }}>
            <Image systemName="globe" font="caption2" foregroundStyle={subtle} />
            <Text font="caption" foregroundStyle={subtle} lineLimit={1}>{host}</Text>
          </HStack>
        </VStack>
      </VStack>
    </Button>
  );
}

// MARK: Video

function VideoEmbed({ embed, width, compact }: { embed: Extract<MediaView, { $type: "app.bsky.embed.video#view" }>; width: number; compact: boolean }) {
  const autoplay = useSettings((s) => s.autoplayVideos);
  const [playing, setPlaying] = useState(false);
  // Rows are rendered ahead of the scroll position: only play while on screen.
  const [visible, setVisible] = useState(false);
  const ratio = embed.aspectRatio ? embed.aspectRatio.width / embed.aspectRatio.height : 16 / 9;
  const height = Math.round(width / Math.min(Math.max(ratio, compact ? 1 : 0.8), 2));
  if (playing || (autoplay && !compact)) {
    return (
      <Video
        src={embed.playlist}
        autoPlay
        paused={!visible}
        onAppear={() => setVisible(true)}
        onDisappear={() => setVisible(false)}
        muted={!playing}
        loop={!playing}
        controls={playing}
        contentMode="fit"
        frame={{ width, height }}
        background="black"
        cornerRadius={RADIUS}
        accessibilityLabel={embed.alt ? `Video: ${embed.alt}` : "Video"}
        accessibilityIdentifier="post-video"
      >
        {!playing ? (
          <Overlay alignment="bottomTrailing">
            <Button onPress={() => setPlaying(true)} accessibilityLabel="Play with sound" padding={8}>
              <Image systemName="speaker.slash.fill" font="caption" foregroundStyle="white" padding={7} background="black/55" cornerRadius="capsule" />
            </Button>
          </Overlay>
        ) : null}
      </Video>
    );
  }
  return (
    <Button onPress={() => setPlaying(true)} pressedOpacity={0.85} accessibilityLabel={embed.alt ? `Play video: ${embed.alt}` : "Play video"} accessibilityIdentifier="post-video">
      <ZStack frame={{ width, height }} background="black" cornerRadius={RADIUS}>
        {embed.thumbnail ? <Image src={embed.thumbnail} contentMode="fill" frame={{ width, height }} /> : null}
        <Image systemName="play.fill" font={{ size: 24 }} foregroundStyle="white" frame={{ width: 56, height: 56 }} background="black/55" cornerRadius="capsule" />
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
      return <Placeholder icon="trash" text="Deleted post" width={width} />;
    case "app.bsky.embed.record#viewBlocked":
      return <Placeholder icon="hand.raised" text="Blocked post" width={width} />;
    case "app.bsky.embed.record#viewDetached":
      return <Placeholder icon="link.badge.plus" text="Removed by author" width={width} />;
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
      <VStack alignment="leading" spacing={6} padding={12} frame={{ width, alignment: "leading" }} cornerRadius={RADIUS} border={{ color: hairline, width: 1 }}>
        <HStack spacing={6}>
          <Avatar uri={record.author.avatar} size={18} />
          <Text font="subheadline" fontWeight="semibold" lineLimit={1} layoutPriority={1}>{displayName(record.author)}</Text>
          <Text font="subheadline" foregroundStyle={subtle} lineLimit={1}>@{record.author.handle}</Text>
          <Text font="subheadline" foregroundStyle={subtle} fixedSize>· {ago(record.indexedAt, now)}</Text>
        </HStack>
        {record.value.text ? <Text font="subheadline" lineLimit={6}>{record.value.text}</Text> : null}
        {media && media.$type !== "app.bsky.embed.record#view" ? <Embed embed={media} width={inner} compact /> : null}
      </VStack>
    </Button>
  );
}

function FeedCard({ uri, title, subtitle, avatar, width }: { uri?: string; title: string; subtitle: string; avatar?: string; width: number }) {
  const nav = useNavigation();
  return (
    <Button onPress={() => uri && nav.push(<FeedScreen uri={uri} title={title} />)} pressedOpacity={0.8} disabled={!uri}>
      <HStack spacing={10} padding={12} frame={{ width, alignment: "leading" }} cornerRadius={RADIUS} border={{ color: hairline, width: 1 }}>
        <Avatar uri={avatar} size={36} square />
        <VStack alignment="leading" spacing={2}>
          <Text font="subheadline" fontWeight="semibold" lineLimit={1}>{title}</Text>
          <Text font="footnote" foregroundStyle={subtle} lineLimit={1}>{subtitle}</Text>
        </VStack>
        <Spacer />
        {uri ? <Image systemName="chevron.right" font="footnote" foregroundStyle={subtle} /> : null}
      </HStack>
    </Button>
  );
}

function Placeholder({ icon, text, width }: { icon: string; text: string; width: number }) {
  return (
    <HStack spacing={8} padding={12} frame={{ width, alignment: "leading" }} background={cardBackground} cornerRadius={RADIUS}>
      <Image systemName={icon} foregroundStyle={subtle} />
      <Text font="subheadline" foregroundStyle={subtle}>{text}</Text>
    </HStack>
  );
}

