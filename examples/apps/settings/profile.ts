// Profile validation (zod + URL), input formatting, and a fake "is this
// username taken?" service.
import { useEffect, useState } from "react";
import { z } from "zod";
import { differenceInYears, format, isValid, parse, startOfToday, subYears } from "date-fns";
import type { Profile } from "./store";

export const BIO_LIMIT = 160;

export const pronounOptions = [
  { value: "", label: "Not Specified" },
  { value: "she/her", label: "she/her" },
  { value: "he/him", label: "he/him" },
  { value: "they/them", label: "they/them" },
  { value: "custom", label: "Custom…" },
];

// MARK: Field rules

export const usernameSchema = z
  .string()
  .min(3, "At least 3 characters")
  .max(20, "At most 20 characters")
  .regex(/^[a-z0-9._]+$/, "Only letters, numbers, “.” and “_”")
  .regex(/^[a-z0-9]/, "Start with a letter or number")
  .refine((name) => !name.endsWith(".") && !name.includes(".."), "Dots can’t repeat or end a username");

/** "jordan.dev", "https://jordan.dev/about" → a full URL, or null if it isn't one. */
export function parseWebsite(input: string): URL | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // "https://localhost" parses, but isn't a website anyone else can visit.
    if (!/^[^.]+(\.[^.]+)+$/.test(url.hostname) || url.hostname.endsWith(".")) return null;
    return url;
  } catch {
    return null;
  }
}

const phoneDigits = (phone: string) => phone.replace(/\D/g, "");

/** As-you-type phone formatting: "(415) 555-0132", or "+44…" kept as digits. */
export function formatPhone(input: string): string {
  if (input.trimStart().startsWith("+")) return "+" + phoneDigits(input).slice(0, 15);
  const d = phoneDigits(input).slice(0, 10);
  // No trailing separators, so backspace never "sticks" on one.
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export const parseBirthday = (value: string) => {
  const date = parse(value, "yyyy-MM-dd", new Date(2000, 0, 1));
  return isValid(date) ? date : null;
};

/** Stored as "yyyy-MM-dd" (a day, with no time zone to shift it). */
export const formatBirthday = (date: Date) => format(date, "yyyy-MM-dd");

/** What the birthday picker offers: 13 to 113 years ago. */
export function birthdayRange(now = startOfToday()) {
  const latest = subYears(now, 13);
  return { min: subYears(latest, 100), max: latest };
}

const profileSchema = z.object({
  name: z.string().trim().min(1, "Your name can’t be empty").max(60, "That name is too long"),
  username: usernameSchema,
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  phone: z.string().refine((phone) => {
    const digits = phoneDigits(phone);
    if (!digits) return true;
    return phone.startsWith("+") ? digits.length >= 8 : digits.length === 10;
  }, "Enter a 10-digit number, or start with + for international"),
  bio: z.string().max(BIO_LIMIT, `At most ${BIO_LIMIT} characters`),
  birthday: z.string().refine((value) => {
    if (!value) return true;
    const date = parseBirthday(value);
    return !!date && differenceInYears(new Date(), date) >= 13;
  }, "You need to be at least 13"),
  pronouns: z.string(),
  customPronouns: z.string().max(24, "Keep it short"),
  website: z.string().refine((value) => !value.trim() || parseWebsite(value) !== null, "Enter a web address like example.com"),
});

export type ProfileErrors = Partial<Record<keyof Profile, string>>;

export function validateProfile(profile: Profile): ProfileErrors {
  const result = profileSchema.safeParse(profile);
  const errors: ProfileErrors = {};
  if (result.success) return errors;
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof Profile;
    errors[key] ??= issue.message;
  }
  if (profile.pronouns === "custom" && !profile.customPronouns.trim()) errors.customPronouns = "Enter your pronouns";
  return errors;
}

/** What gets saved: trimmed, website normalized to a full URL. */
export function normalizeProfile(profile: Profile): Profile {
  const website = parseWebsite(profile.website);
  return {
    ...profile,
    name: profile.name.trim(),
    email: profile.email.trim().toLowerCase(),
    bio: profile.bio.trim(),
    website: website ? website.href.replace(/\/$/, "") : "",
    customPronouns: profile.pronouns === "custom" ? profile.customPronouns.trim() : "",
  };
}

export const profilesEqual = (a: Profile, b: Profile) =>
  (Object.keys(a) as (keyof Profile)[]).every((key) => a[key] === b[key]);

export function pronounsLabel(profile: Profile): string {
  return profile.pronouns === "custom" ? profile.customPronouns : profile.pronouns;
}

// MARK: Birthday

export function describeBirthday(value: string): string | null {
  const date = parseBirthday(value);
  if (!date) return null;
  return `${format(date, "MMMM d, yyyy")} · ${differenceInYears(new Date(), date)} years old`;
}

// MARK: Username availability (a pretend server)

const taken = new Set(["admin", "root", "support", "help", "jordan", "settings", "swiftjsx", "react", "apple", "test"]);

/** Resolves after a network-ish delay. */
function isUsernameAvailable(username: string): Promise<boolean> {
  const delay = 450 + Math.random() * 600;
  return new Promise((resolve) => setTimeout(() => resolve(!taken.has(username)), delay));
}

export type UsernameStatus =
  | { state: "unchanged" }
  | { state: "invalid"; message: string }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; message: string; suggestions: string[] };

/**
 * Live validation for the username field: the format right away (zod), then
 * availability after a short debounce. Stale answers are dropped by keying
 * the result on the name it was for.
 */
export function useUsernameStatus(username: string, current: string): UsernameStatus {
  const [result, setResult] = useState<{ username: string; available: boolean } | null>(null);
  const parsed = usernameSchema.safeParse(username);
  const needsCheck = parsed.success && username !== current;

  useEffect(() => {
    if (!needsCheck) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      isUsernameAvailable(username).then((available) => {
        if (!cancelled) setResult({ username, available });
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, needsCheck]);

  if (!parsed.success) return { state: "invalid", message: parsed.error.issues[0]?.message ?? "Invalid username" };
  if (!needsCheck) return { state: "unchanged" };
  if (result?.username !== username) return { state: "checking" };
  if (result.available) return { state: "available" };
  const base = username.replace(/[._]+$/, "");
  return {
    state: "taken",
    message: `@${username} is already taken`,
    suggestions: [`${base}_${new Date().getFullYear() % 100}`, `${base}.app`, `the.${base}`]
      .filter((s) => usernameSchema.safeParse(s).success && !taken.has(s)),
  };
}
