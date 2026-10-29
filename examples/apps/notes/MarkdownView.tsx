// Renders the notes markdown dialect with styled <Text> runs.
import { Text, HStack, VStack, Image, Divider, type Font, type Fill } from "swiftjsx";
import { parseBlocks, parseInline, type Block, type Span } from "./markdown";

const headingFont: Record<1 | 2 | 3, Font> = { 1: "title", 2: "title2", 3: "title3" };

/** One inline span as a run of its parent <Text>; a link opens with `onLink`. */
function Run({ span, onLink }: { span: Span; onLink?: (url: string) => void }) {
  const link = span.link;
  return (
    <Text
      bold={span.bold}
      italic={span.italic}
      strikethrough={span.strike}
      fontDesign={span.code ? "monospaced" : undefined}
      foregroundStyle={span.code ? "pink" : span.link ? "link" : undefined}
      underline={span.link ? true : undefined}
      onPress={link && onLink ? () => onLink(link) : undefined}
    >
      {span.text}
    </Text>
  );
}

/** Inline markdown as one <Text> with a run per span. */
export function Inline({ text, font, color, strike, bold, onLink }: {
  text: string;
  font?: Font;
  color?: Fill;
  strike?: boolean;
  bold?: boolean;
  onLink?: (url: string) => void;
}) {
  const spans = parseInline(text);
  return (
    <Text font={font} foregroundStyle={color} strikethrough={strike} bold={bold}>
      {spans.length ? spans.map((span, i) => <Run key={i} span={span} onLink={onLink} />) : " "}
    </Text>
  );
}

/** One line. `onToggle` makes a checklist circle tappable; `onLink` makes links open. */
export function BlockView({ block, onToggle, onLink }: {
  block: Block;
  onToggle?: () => void;
  onLink?: (url: string) => void;
}) {
  const indent = "indent" in block ? block.indent * 18 : 0;

  switch (block.kind) {
    case "heading":
      return (
        <Inline
          text={block.text}
          font={headingFont[block.level]}
          bold
          onLink={onLink}
        />
      );
    case "task":
      return (
        <HStack alignment="firstTextBaseline" spacing={8} padding={{ leading: indent }}>
          <Image
            systemName={block.done ? "checkmark.circle.fill" : "circle"}
            font="title3"
            foregroundStyle={block.done ? "orange" : "tertiaryLabel"}
            onTapGesture={onToggle}
            accessibilityLabel={block.done ? "Checked" : "Unchecked"}
            accessibilityTraits={onToggle ? "button" : undefined}
            accessibilityIdentifier="note-checkbox"
          />
          <Inline text={block.text} color={block.done ? "secondary" : undefined} strike={block.done} onLink={onLink} />
        </HStack>
      );
    case "bullet":
      return (
        <HStack alignment="firstTextBaseline" spacing={8} padding={{ leading: indent + 6 }}>
          <Text foregroundStyle="orange" fontWeight="bold">{block.indent % 2 ? "◦" : "•"}</Text>
          <Inline text={block.text} onLink={onLink} />
        </HStack>
      );
    case "numbered":
      return (
        <HStack alignment="firstTextBaseline" spacing={6} padding={{ leading: indent }}>
          <Text foregroundStyle="secondary" monospacedDigit>{`${block.marker}.`}</Text>
          <Inline text={block.text} onLink={onLink} />
        </HStack>
      );
    case "quote":
      // A quote is a tinted box.
      return (
        <HStack spacing={8} padding={{ horizontal: 12, vertical: 8 }} background="orange/10" cornerRadius={8}>
          <Image systemName="quote.opening" font="caption" foregroundStyle="orange" />
          <Inline text={block.text} color="secondary" onLink={onLink} />
        </HStack>
      );
    case "fence":
      return <Text font="caption" fontDesign="monospaced" foregroundStyle="tertiary">{"```" + block.lang}</Text>;
    case "code":
      return (
        <Text font="callout" fontDesign="monospaced" padding={{ horizontal: 8, vertical: 1 }} frame={{ maxWidth: "infinity", alignment: "leading" }} background="secondarySystemFill">
          {block.text || " "}
        </Text>
      );
    case "rule":
      return <Divider padding={{ vertical: 8 }} />;
    case "blank":
      return <Text font="body">{" "}</Text>;
    case "paragraph":
      return <Inline text={block.text} onLink={onLink} />;
  }
}

type Item = { key: number; block: Block; index: number } | { key: number; code: string; lang: string };

/** Fenced code becomes one block; everything else is a line. */
function group(blocks: Block[]): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.kind !== "fence") {
      items.push({ key: i, block, index: i });
      continue;
    }
    const code: string[] = [];
    let j = i + 1;
    for (; j < blocks.length; j++) {
      const b = blocks[j];
      if (b.kind !== "code") break;
      code.push(b.text);
    }
    items.push({ key: i, code: code.join("\n"), lang: block.lang });
    i = j; // skip the closing fence too
  }
  return items;
}

/** Read mode: the whole note rendered. */
export function ReadView({ lines, onToggle, onLink }: {
  lines: string[];
  onToggle?: (index: number) => void;
  onLink: (url: string) => void;
}) {
  const items = group(parseBlocks(lines));
  return (
    <VStack alignment="leading" spacing={8} frame={{ maxWidth: "infinity", alignment: "leading" }}>
      {items.map((item) =>
        "code" in item ? (
          <VStack key={item.key} alignment="leading" spacing={4} padding={12} frame={{ maxWidth: "infinity", alignment: "leading" }} background="secondarySystemFill" cornerRadius={10}>
            {item.lang ? <Text font="caption2" foregroundStyle="secondary" textCase="uppercase">{item.lang}</Text> : null}
            <Text font="callout" fontDesign="monospaced" lineSpacing={2}>{item.code || " "}</Text>
          </VStack>
        ) : item.block.kind === "blank" ? (
          <Spacer8 key={item.key} />
        ) : (
          <BlockView
            key={item.key}
            block={item.block}
            onToggle={onToggle ? () => onToggle(item.index) : undefined}
            onLink={onLink}
          />
        ),
      )}
    </VStack>
  );
}

const Spacer8 = () => <Text font="caption2">{" "}</Text>;
