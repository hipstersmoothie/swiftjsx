// Post text with tappable runs: @mentions open the profile, #tags open a tag
// search (signed in; signed out, bsky.app's tag page), links open in Safari.
import { Text, openURL, useNavigation, type Font } from "swiftjsx";
import { segments, detect, shortenLink, type Segment } from "./richtext";
import { useSession } from "./session";
import { brand } from "./ui";
import { ProfileScreen } from "./Profile";
import { PostSearchScreen } from "./Search";
import type { Facet } from "./types";

type Props = {
  text: string;
  facets?: Facet[];
  font?: Font;
  lineLimit?: number;
  selectable?: boolean;
  /** Find mentions, links and tags in the text itself (profile bios have no facets). */
  detectFacets?: boolean;
  id?: string;
};

export function RichText({ text, facets, font = "body", lineLimit, selectable, detectFacets = false, id }: Props) {
  const nav = useNavigation();
  const signedIn = useSession((s) => s.session !== null);
  const runs = detectFacets ? detectedSegments(text) : segments(text, facets);
  if (!runs.length) return null;

  const open = (run: Segment) => {
    if (run.kind === "mention") nav.push(<ProfileScreen actor={run.did} />);
    else if (run.kind === "link") openURL(run.uri, { inApp: true });
    else if (run.kind === "tag") {
      if (signedIn) nav.push(<PostSearchScreen query={`#${run.tag}`} />);
      else openURL(`https://bsky.app/hashtag/${encodeURIComponent(run.tag)}`, { inApp: true });
    }
  };

  return (
    <Text font={font} lineLimit={lineLimit} selectable={selectable} accessibilityIdentifier={id}>
      {runs.map((run, i) =>
        run.kind === "text" ? (
          <Text key={i}>{run.text}</Text>
        ) : (
          <Text key={i} foregroundStyle={brand} onPress={() => open(run)}>
            {run.kind === "link" && run.text.startsWith("http") ? shortenLink(run.text) : run.text}
          </Text>
        ),
      )}
    </Text>
  );
}

/** Segments from the text alone (mentions carry the handle, which getProfile also takes). */
function detectedSegments(text: string): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const d of detect(text)) {
    if (d.start < cursor) continue;
    if (d.start > cursor) out.push({ kind: "text", text: text.slice(cursor, d.start) });
    const run = text.slice(d.start, d.end);
    if (d.kind === "mention") out.push({ kind: "mention", text: run, did: d.handle });
    else if (d.kind === "link") out.push({ kind: "link", text: run, uri: d.uri });
    else out.push({ kind: "tag", text: run, tag: d.tag });
    cursor = d.end;
  }
  if (cursor < text.length) out.push({ kind: "text", text: text.slice(cursor) });
  return out;
}
