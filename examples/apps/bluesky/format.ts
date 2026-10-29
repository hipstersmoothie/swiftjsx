// Dates and names, the way the Bluesky app shows them. Counts and relative
// times come from the kit's `format` (compact, count, relativeTime). Formatters
// are made once (Intl constructors are slow without a JIT).

const fullTime = new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" });
const joined = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

export const fullTimestamp = (iso: string) => fullTime.format(new Date(iso));
export const joinedDate = (iso: string) => joined.format(new Date(iso));

export const displayName = (actor: { displayName?: string; handle: string }) => actor.displayName?.trim() || actor.handle;

/** "example.com" from a URL (no www). */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
