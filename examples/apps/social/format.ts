// Older-post dates, compact counts, and caption tokens (@mentions, #hashtags).
import { format as formatDate } from "date-fns";
import { format } from "swiftjsx";

/** "October 3" (with the year when it isn't this one), for posts older than a week. */
export const longDate = (time: number) =>
  formatDate(time, new Date(time).getFullYear() === new Date().getFullYear() ? "MMMM d" : "MMMM d, yyyy");

/** 1,234 · 12.4K · 2.3M (in full under 10,000, as Instagram shows them). */
export const compact = (n: number) => format.compact(n, { from: 10_000 });

export type Token = { text: string; kind: "text" | "mention" | "tag" };

/** Splits text into plain runs, @mentions and #hashtags. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /([@#][\p{L}\p{N}_.]*[\p{L}\p{N}_])/gu;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    // "email@domain" isn't a mention: it must start a word.
    if (at > 0 && /[\p{L}\p{N}_]/u.test(text[at - 1])) continue;
    if (at > last) tokens.push({ text: text.slice(last, at), kind: "text" });
    tokens.push({ text: match[0], kind: match[0][0] === "@" ? "mention" : "tag" });
    last = at + match[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), kind: "text" });
  return tokens;
}
