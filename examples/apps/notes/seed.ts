// What a first launch looks like (persisted state replaces it afterwards).
import type { State, Note } from "./store";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const lines = (...l: string[]) => l.join("\n");

export function seed(): State {
  const now = Date.now();
  let n = 0;
  const note = (folderId: string, title: string, body: string, ago: number, extra: Partial<Note> = {}): Note => ({
    id: `seed-${++n}`,
    folderId,
    title,
    body,
    createdAt: now - ago - 3 * DAY,
    updatedAt: now - ago,
    pinned: false,
    deletedAt: null,
    ...extra,
  });

  return {
    sort: "edited",
    folders: [
      { id: "notes", name: "Notes", icon: "folder" },
      { id: "work", name: "Work", icon: "briefcase" },
      { id: "personal", name: "Personal", icon: "house" },
      { id: "ideas", name: "Ideas", icon: "lightbulb" },
    ],
    notes: [
      note(
        "notes",
        "Welcome to Notes",
        lines(
          "Notes are written in a **lightweight markdown**. Tap the _book_ button to read a note, the pencil to edit it.",
          "",
          "## Formatting",
          "- **Bold**, _italic_, ~~strikethrough~~ and `inline code`",
          "- Links like [SwiftUI](https://developer.apple.com/xcode/swiftui/) or https://react.dev",
          "- Headings with #, ## and ###",
          "",
          "## Checklists",
          "- [x] Tap a circle to check it off",
          "- [ ] Swipe a note right to pin it",
          "- [ ] Swipe left to delete (it goes to Recently Deleted)",
          "",
          "> Tip: press Return in a list to continue it; Return on an empty item ends the list.",
          "",
          "---",
          "Search finds words in every note and highlights them.",
        ),
        2 * MINUTE,
        { pinned: true },
      ),
      note(
        "personal",
        "Groceries",
        lines("- [ ] Oat milk", "- [x] Eggs", "- [ ] Coffee beans", "- [ ] Basil", "- [x] Sourdough", "- [ ] Lemons"),
        3 * 60 * MINUTE,
        { pinned: true },
      ),
      note(
        "work",
        "Sprint planning",
        lines(
          "# Q4 sprint 3",
          "Attendees: Maya, Sam, Priya",
          "",
          "## Decisions",
          "1. Ship the **offline mode** behind a flag",
          "2. Move the design review to Thursday",
          "",
          "## Action items",
          "- [ ] Sam: write the migration plan",
          "- [x] Priya: update the [roadmap](https://example.com/roadmap)",
          "- [ ] Maya: book the demo room",
        ),
        DAY + 2 * 60 * MINUTE,
      ),
      note(
        "work",
        "Debounce snippet",
        lines(
          "The autosave in this app is a debounced effect:",
          "```ts",
          "useEffect(() => {",
          "  const t = setTimeout(save, 600);",
          "  return () => clearTimeout(t);",
          "}, [draft]);",
          "```",
          "Keep the _cleanup_ so fast typing never saves twice.",
        ),
        3 * DAY,
      ),
      note(
        "ideas",
        "",
        lines(
          "App ideas",
          "- A plant-watering tracker with **streaks**",
          "- Recipe scaler: paste a recipe, pick servings",
          "- Trail log with photos and a map",
        ),
        5 * DAY,
      ),
      note(
        "personal",
        "Shakshuka",
        lines(
          "## Ingredients",
          "- 6 eggs",
          "- 1 can crushed tomatoes",
          "- 1 red pepper, 1 onion, 3 cloves garlic",
          "- Cumin, paprika, chili flakes",
          "",
          "## Steps",
          "1. Soften the onion and pepper, about 8 minutes",
          "2. Add garlic and spices for a minute",
          "3. Pour in the tomatoes, simmer 10 minutes",
          "4. Make wells, crack in the eggs, cover until _just_ set",
        ),
        12 * DAY,
      ),
      note("notes", "Books to read", lines("- The Design of Everyday Things", "- Thinking in Systems", "- A Pattern Language"), 40 * DAY),
      note("notes", "Old parking spot", "Level 3, row F", 6 * DAY, { deletedAt: now - 4 * DAY }),
    ],
  };
}
