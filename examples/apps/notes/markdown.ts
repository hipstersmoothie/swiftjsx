// A small markdown dialect for notes: headings (#, ##, ###), **bold**,
// _italic_ / *italic*, ~~strike~~, `code`, [links](https://…) and bare URLs,
// - bullets, 1. numbered items, - [ ] / - [x] checklists, > quotes, ``` code
// fences and --- rules. Parsed line by line (the editor edits one line at a
// time), with fences tracked across lines.

// MARK: Inline spans

export type Span = { text: string; bold?: boolean; italic?: boolean; strike?: boolean; code?: boolean; link?: string };
type Style = Omit<Span, "text">;

// One alternative per syntax, in priority order: code, bold, strike, italic, link, bare URL.
const TOKEN =
  /`([^`]+)`|\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\*([^*\s](?:[^*]*?[^*\s])?)\*|(?<![\w])_([^_\s](?:[^_]*?[^_\s])?)_(?![\w])|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])/g;

export function parseInline(text: string, style: Style = {}): Span[] {
  const out: Span[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ ...style, text: text.slice(last, start) });
    if (m[1] != null) out.push({ ...style, code: true, text: m[1] });
    else if (m[2] != null || m[3] != null) out.push(...parseInline(m[2] ?? m[3], { ...style, bold: true }));
    else if (m[4] != null) out.push(...parseInline(m[4], { ...style, strike: true }));
    else if (m[5] != null || m[6] != null) out.push(...parseInline(m[5] ?? m[6], { ...style, italic: true }));
    else if (m[7] != null) out.push(...parseInline(m[7], { ...style, link: m[8] }));
    else if (m[9] != null) out.push({ ...style, link: m[9], text: m[9] });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ ...style, text: text.slice(last) });
  return out;
}

export const spansText = (spans: Span[]) => spans.map((s) => s.text).join("");

export function links(spans: Span[]): string[] {
  const urls = spans.flatMap((s) => (s.link ? [s.link] : []));
  return urls.filter((u, i) => urls.indexOf(u) === i);
}

// MARK: Blocks (one per line)

export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "task"; done: boolean; text: string; indent: number }
  | { kind: "bullet"; text: string; indent: number }
  | { kind: "numbered"; marker: string; text: string; indent: number }
  | { kind: "quote"; text: string }
  | { kind: "fence"; lang: string }
  | { kind: "code"; text: string }
  | { kind: "rule" }
  | { kind: "blank" }
  | { kind: "paragraph"; text: string };

const FENCE = /^\s*```(.*)$/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const TASK = /^(\s*)[-*+]\s+\[([ xX])\](?:\s+(.*))?$/;
const BULLET = /^(\s*)[-*+]\s+(.*)$/;
const NUMBERED = /^(\s*)(\d{1,4})[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;

const indentLevel = (spaces: string) => Math.min(4, Math.floor(spaces.replace(/\t/g, "  ").length / 2));

/** Classifies each line; lines inside a ``` fence are code. */
export function parseBlocks(lines: string[]): Block[] {
  let inCode = false;
  return lines.map((line): Block => {
    const fence = FENCE.exec(line);
    if (fence) {
      inCode = !inCode;
      return { kind: "fence", lang: fence[1].trim() };
    }
    if (inCode) return { kind: "code", text: line };
    if (!line.trim()) return { kind: "blank" };
    let m: RegExpExecArray | null;
    if ((m = HEADING.exec(line))) return { kind: "heading", level: m[1].length as 1 | 2 | 3, text: m[2] };
    if (RULE.test(line)) return { kind: "rule" };
    if ((m = TASK.exec(line))) return { kind: "task", done: m[2] !== " ", text: m[3] ?? "", indent: indentLevel(m[1]) };
    if ((m = BULLET.exec(line))) return { kind: "bullet", text: m[2], indent: indentLevel(m[1]) };
    if ((m = NUMBERED.exec(line))) return { kind: "numbered", marker: m[2], text: m[3], indent: indentLevel(m[1]) };
    if ((m = QUOTE.exec(line))) return { kind: "quote", text: m[1] };
    return { kind: "paragraph", text: line };
  });
}

/** The visible text of a block (no markers). */
export function blockText(block: Block): string {
  switch (block.kind) {
    case "rule":
    case "blank":
    case "fence":
      return "";
    case "code":
      return block.text;
    default:
      return spansText(parseInline(block.text));
  }
}

/** The note body as plain text: what counts, previews and search use. */
export function plainLines(body: string): string[] {
  return parseBlocks(body.split("\n")).map(blockText);
}

export function counts(title: string, body: string): { words: number; characters: number } {
  const text = [title, ...plainLines(body)].join("\n");
  return {
    words: text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length,
    characters: Array.from(text.replace(/\n/g, "")).length,
  };
}

// MARK: Line editing (the formatting toolbar)
//
// There's no cursor or selection API on TextField, so formatting applies to
// the whole line being edited.

const PREFIX = /^(\s*(?:#{1,3}\s+|[-*+]\s+\[[ xX]\]\s+|[-*+]\s+\[[ xX]\]$|[-*+]\s+|\d{1,4}[.)]\s+|>\s?)?)(.*)$/;

function splitPrefix(line: string): [prefix: string, content: string] {
  const m = PREFIX.exec(line);
  return m ? [m[1], m[2]] : ["", line];
}

/** Wraps the line's content in `marker` (e.g. "**"), or unwraps it. */
export function toggleWrap(line: string, marker: string): string {
  const [prefix, content] = splitPrefix(line);
  if (!content.trim()) return line;
  const n = marker.length;
  if (content.length > 2 * n && content.startsWith(marker) && content.endsWith(marker)) {
    return prefix + content.slice(n, -n);
  }
  return prefix + marker + content + marker;
}

/** None → # → ## → ### → none. Replaces a list prefix. */
export function cycleHeading(line: string): string {
  const [prefix, content] = splitPrefix(line);
  const level = /^#{1,3}\s/.test(prefix) ? prefix.trim().length : 0;
  return level === 3 ? content : "#".repeat(level + 1) + " " + content;
}

export function toggleTask(line: string): string {
  const [, content] = splitPrefix(line);
  return TASK.test(line) ? content : "- [ ] " + content;
}

export function toggleBullet(line: string): string {
  const [, content] = splitPrefix(line);
  return BULLET.test(line) && !TASK.test(line) ? content : "- " + content;
}

/** Checks or unchecks a "- [ ]" line. */
export function flipTask(line: string): string {
  return line.replace(/^(\s*[-*+]\s+\[)([ xX])\]/, (_, open: string, mark: string) => `${open}${mark === " " ? "x" : " "}]`);
}

/**
 * What a new line after `line` starts with when you press Return: lists
 * continue. `null` means the item was empty: end the list instead (clear this
 * line's marker), like Notes and Bear.
 */
export function continuation(line: string): string | null {
  let m: RegExpExecArray | null;
  if ((m = TASK.exec(line))) return m[3]?.trim() ? `${m[1]}- [ ] ` : null;
  if ((m = BULLET.exec(line))) return m[2].trim() ? line.slice(0, line.length - m[2].length) : null;
  if ((m = NUMBERED.exec(line))) return m[3].trim() ? `${m[1]}${Number(m[2]) + 1}. ` : null;
  if ((m = QUOTE.exec(line))) return m[1].trim() ? "> " : null;
  return "";
}

// MARK: Search

/** Splits `text` into runs, marking case-insensitive matches of `query`. */
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  const q = query.toLowerCase();
  if (!q) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const out: { text: string; match: boolean }[] = [];
  let at = 0;
  for (let i = lower.indexOf(q); i !== -1; i = lower.indexOf(q, at)) {
    if (i > at) out.push({ text: text.slice(at, i), match: false });
    out.push({ text: text.slice(i, i + q.length), match: true });
    at = i + q.length;
  }
  if (at < text.length) out.push({ text: text.slice(at), match: false });
  return out;
}

/** A window of `text` around the first match, with ellipses. */
export function snippet(text: string, query: string, before = 24, after = 90): string | null {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return null;
  const start = Math.max(0, i - before);
  // Start at a word boundary.
  const from = start === 0 ? 0 : text.indexOf(" ", start) + 1 || start;
  const end = Math.min(text.length, i + query.length + after);
  return (from > 0 ? "…" : "") + text.slice(from, end).trim() + (end < text.length ? "…" : "");
}

// MARK: Export

/** Markdown → plain text, for "Plain Text" export. */
export function toPlainText(title: string, body: string): string {
  const blocks = parseBlocks(body.split("\n"));
  const lines = blocks.flatMap((b): string[] => {
    switch (b.kind) {
      case "fence":
        return [];
      case "rule":
        return ["———"];
      case "task":
        return ["  ".repeat(b.indent) + (b.done ? "☑︎ " : "☐ ") + blockText(b)];
      case "bullet":
        return ["  ".repeat(b.indent) + "• " + blockText(b)];
      case "numbered":
        return ["  ".repeat(b.indent) + b.marker + ". " + blockText(b)];
      default:
        return [blockText(b)];
    }
  });
  return [title, "", ...lines].join("\n").trim();
}

export function toMarkdown(title: string, body: string): string {
  return (title.trim() ? `# ${title.trim()}\n\n` : "") + body;
}
