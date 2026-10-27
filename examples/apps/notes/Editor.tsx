// The detail column: a note's title and body.
//
// Three ways to look at the body:
//  - "edit" (default): a live-preview line editor, like Bear. Every line is
//    rendered markdown except the one you're editing, which is a plain,
//    vertically growing TextField. The formatting toolbar acts on that line
//    (TextField has no cursor or selection API, so "the current line" is the
//    finest thing it can format).
//  - "source": one TextEditor with the raw markdown (select across lines,
//    paste long text). The toolbar acts on the last line.
//  - "read": rendered markdown; checkboxes toggle, links open.
import { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import {
  openURL, withAnimation, Screen, ToolbarItem, ScrollView, VStack, HStack, Text, TextField, TextEditor, Image, Button,
  Label, Menu, Divider, Spacer, Alert, ConfirmationDialog, type HostInstance, type Font,
} from "swiftjsx";
import {
  useNotes, saveNote, updateNote, trashNotes, restoreNote, destroyNotes, daysLeft, type Note, type Folder,
} from "./store";
import {
  parseBlocks, counts, toggleWrap, cycleHeading, toggleTask, toggleBullet, flipTask, continuation, toMarkdown, type Block,
} from "./markdown";
import { BlockView, ReadView } from "./MarkdownView";
import { isEmptyNote, longDate, useNow } from "./format";
import { ExportSheet } from "./ExportSheet";
import { hasUIKit, shareText } from "./share";

/** Every line field starts with this, so backspace at its start is visible (it deletes the sentinel). */
const ZWSP = "​";
const AUTOSAVE_MS = 600;

type Line = { id: string; text: string };
type Draft = { title: string; lines: Line[] };
type Mode = "edit" | "source" | "read";

const newLine = (text: string): Line => ({ id: nanoid(8), text });
const toLines = (body: string): Line[] => (body ? body.split("\n").map(newLine) : []);
const bodyOf = (lines: Line[]) => lines.map((l) => l.text).join("\n");
/** Re-splits edited source text, keeping line ids by position. */
const relines = (old: Line[], body: string): Line[] =>
  body.split("\n").map((text, i) => (old[i] && old[i].text === text ? old[i] : { id: old[i]?.id ?? nanoid(8), text }));

export function NoteDetail({ id, autoFocusTitle, onClose }: { id: string; autoFocusTitle: boolean; onClose(): void }) {
  const note = useNotes((s) => s.notes.find((n) => n.id === id));
  const folders = useNotes((s) => s.folders);
  if (!note) return <NoNoteSelected />;
  return <Editor note={note} folders={folders} autoFocusTitle={autoFocusTitle} onClose={onClose} />;
}

export function NoNoteSelected() {
  return (
    <Screen title="">
      <VStack spacing={10} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} accessibilityElement="combine">
        <Image systemName="note.text" font="largeTitle" foregroundStyle="tertiary" />
        <Text font="title3" foregroundStyle="secondary">No Note Selected</Text>
      </VStack>
    </Screen>
  );
}

function Editor({ note, folders, autoFocusTitle, onClose }: { note: Note; folders: Folder[]; autoFocusTitle: boolean; onClose(): void }) {
  const now = useNow();
  const deleted = note.deletedAt !== null;
  const [draft, setDraft] = useState<Draft>(() => ({ title: note.title, lines: toLines(note.body) }));
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<Mode>(deleted ? "read" : "edit");
  /** The line shown as a text field (edit mode). */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** What has keyboard focus: "title", "source", a line id, or nothing. */
  const [focused, setFocused] = useState<string | null>(null);
  const [linkChoices, setLinkChoices] = useState<string[] | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmingDestroy, setConfirmingDestroy] = useState(false);
  const lineField = useRef<HostInstance>(null);
  const titleField = useRef<HostInstance>(null);
  const shareButton = useRef<HostInstance>(null);
  /** When a line last split, so a Return that also fires onSubmit doesn't split twice. */
  const lastSplit = useRef({ id: "", at: 0 });
  const effectiveMode: Mode = deleted ? "read" : mode;

  // MARK: Autosave: debounced while typing, flushed when the editor goes away.

  const body = bodyOf(draft.lines);
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      saveNote(note.id, { title: draft.title, body });
      setDirty(false);
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [dirty, draft.title, body, note.id]);

  const latest = useRef({ dirty, title: draft.title, body });
  useEffect(() => {
    latest.current = { dirty, title: draft.title, body };
  });
  useEffect(() => {
    const id = note.id;
    return () => {
      const { dirty, title, body } = latest.current;
      if (dirty) saveNote(id, { title, body });
      // Leaving a note you never wrote anything in throws it away, like Notes.
      const saved = useNotes.getState().notes.find((n) => n.id === id);
      if (saved && saved.deletedAt === null && isEmptyNote(saved)) destroyNotes([id]);
    };
  }, [note.id]);

  // MARK: Editing

  const change = (fn: (d: Draft) => Draft) => {
    setDraft(fn);
    setDirty(true);
  };
  const setLineText = (lineId: string, text: string) =>
    change((d) => ({ ...d, lines: d.lines.map((l) => (l.id === lineId ? { ...l, text } : l)) }));

  /** Starts editing a line; its field focuses itself when it appears. */
  const edit = (lineId: string) => setEditingId(lineId);

  /** Backspace at the start of a line: join it to the line above (or the title). */
  const mergeUp = (index: number, text: string) => {
    const line = draft.lines[index];
    if (index === 0) {
      change((d) => ({ title: d.title + text, lines: d.lines.filter((l) => l.id !== line.id) }));
      setEditingId(null);
      titleField.current?.focus();
      return;
    }
    const prev = draft.lines[index - 1];
    change((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== line.id).map((l) => (l.id === prev.id ? { ...l, text: l.text + text } : l)) }));
    edit(prev.id);
  };

  /** A newline arrived (Return, or a multi-line paste): split the line there. */
  const split = (line: Line, text: string) => {
    lastSplit.current = { id: line.id, at: Date.now() };
    const [head, ...rest] = text.split("\n");
    // Return at the end of a list item continues the list; on an empty item it ends it.
    if (rest.length === 1 && rest[0] === "") {
      const next = continuation(head);
      if (next === null) return setLineText(line.id, "");
      rest[0] = next;
    }
    const added = rest.map(newLine);
    change((d) => {
      const lines = [...d.lines];
      const i = lines.findIndex((l) => l.id === line.id);
      lines.splice(i, 1, { ...line, text: head }, ...added);
      return { ...d, lines };
    });
    edit(added[added.length - 1].id);
  };

  const submitted = (line: Line) => {
    const last = lastSplit.current;
    if (last.id === line.id && Date.now() - last.at < 500) return;
    split(line, line.text + "\n");
  };

  const onLineChange = (line: Line, index: number, raw: string) => {
    if (!raw.startsWith(ZWSP)) {
      // The sentinel is gone. Unchanged text means backspace at the start;
      // anything else is a replacement (select all, type) or typing before it.
      if (raw === line.text) return mergeUp(index, raw);
      return setLineText(line.id, raw.split(ZWSP).join(""));
    }
    const text = raw.slice(1).split(ZWSP).join("");
    if (text.includes("\n")) return split(line, text);
    setLineText(line.id, text);
  };

  /** A tap below the last line: edit it if it's blank, else start a new one. */
  const editEnd = () => {
    const last = draft.lines[draft.lines.length - 1];
    if (last && !last.text.trim()) return edit(last.id);
    const line = newLine("");
    change((d) => ({ ...d, lines: [...d.lines, line] }));
    edit(line.id);
  };

  const titleSubmitted = () => {
    const first = draft.lines[0];
    if (first) return edit(first.id);
    const line = newLine("");
    change((d) => ({ ...d, lines: [line] }));
    edit(line.id);
  };

  const toggleLine = (index: number) =>
    change((d) => ({ ...d, lines: d.lines.map((l, i) => (i === index ? { ...l, text: flipTask(l.text) } : l)) }));

  /** The formatting toolbar: the line being edited, or the last line in source mode. */
  const format = (fn: (line: string) => string) => {
    const target = effectiveMode === "source" ? draft.lines[draft.lines.length - 1] : draft.lines.find((l) => l.id === editingId);
    if (target) setLineText(target.id, fn(target.text));
  };

  const doneEditing = () => {
    lineField.current?.blur();
    titleField.current?.blur();
    setEditingId(null);
    setFocused(null);
  };

  const switchMode = (next: Mode) => {
    doneEditing();
    withAnimation("snappy", () => setMode(next));
  };

  // MARK: Links, sharing

  const openLinks = (urls: string[]) => (urls.length === 1 ? openLink(urls[0]) : setLinkChoices(urls));

  const exportText = toMarkdown(draft.title, body);
  const share = async () => {
    if (!hasUIKit()) return setExporting(true);
    const anchor = await shareButton.current?.measure();
    shareText(exportText, anchor).catch((e) => {
      console.error(e);
      setExporting(true);
    });
  };

  const close = (fn: () => void) => {
    onClose();
    withAnimation("snappy", fn);
  };

  const blocks = parseBlocks(draft.lines.map((l) => l.text));
  const { words, characters } = counts(draft.title, body);
  const otherFolders = folders.filter((f) => f.id !== note.folderId);

  const header = (
    <>
      {deleted ? (
        <HStack spacing={10} padding={12} background="red/10" cornerRadius={12} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          <Image systemName="trash" foregroundStyle="red" />
          <Text font="subheadline" frame={{ maxWidth: "infinity", alignment: "leading" }}>
            {`In Recently Deleted. It will be deleted in ${daysLeft(note, now)} ${daysLeft(note, now) === 1 ? "day" : "days"}.`}
          </Text>
          <Button title="Recover" buttonStyle="borderedProminent" tint="red" onPress={() => withAnimation("snappy", () => restoreNote(note.id))} />
        </HStack>
      ) : null}

      {effectiveMode === "read" ? (
        <Text font="largeTitle" fontWeight="bold" accessibilityIdentifier="note-title" accessibilityTraits="header">
          {draft.title || "Untitled"}
        </Text>
      ) : (
        <TextField
          ref={titleField}
          value={draft.title}
          onChange={(title) => change((d) => ({ ...d, title }))}
          onSubmit={titleSubmitted}
          onFocus={() => setFocused("title")}
          onBlur={() => setFocused((f) => (f === "title" ? null : f))}
          autoFocus={autoFocusTitle}
          submitLabel="next"
          textFieldStyle="plain"
          placeholder="Title"
          font="largeTitle"
          fontWeight="bold"
          accessibilityLabel="Title"
          accessibilityIdentifier="note-title"
        />
      )}

      <Text font="footnote" foregroundStyle="secondary" accessibilityIdentifier="note-counts">
        {`${longDate(note.updatedAt)} · ${words} ${words === 1 ? "word" : "words"} · ${characters} ${characters === 1 ? "character" : "characters"}`}
        <Text foregroundStyle="tertiary">{dirty ? " · Saving…" : " · Saved"}</Text>
      </Text>
    </>
  );

  return (
    <Screen title="" titleDisplayMode="inline">
      {deleted ? null : (
        <ToolbarItem placement="primaryAction">
          <Button
            onPress={() => switchMode(effectiveMode === "read" ? "edit" : "read")}
            accessibilityLabel={effectiveMode === "read" ? "Edit" : "Read"}
            accessibilityIdentifier="toggle-read-mode"
          >
            <Image systemName={effectiveMode === "read" ? "pencil" : "book"} />
          </Button>
        </ToolbarItem>
      )}
      <ToolbarItem placement="primaryAction">
        <Button ref={shareButton} onPress={share} accessibilityLabel="Share" accessibilityIdentifier="share-note">
          <Image systemName="square.and.arrow.up" />
        </Button>
      </ToolbarItem>
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="ellipsis.circle" accessibilityLabel="More" accessibilityIdentifier="note-menu">
          {deleted ? (
            <>
              <Button onPress={() => withAnimation("snappy", () => restoreNote(note.id))}>
                <Label title="Recover" systemImage="arrow.uturn.backward" />
              </Button>
              <Button role="destructive" onPress={() => setConfirmingDestroy(true)}>
                <Label title="Delete Permanently" systemImage="trash" />
              </Button>
            </>
          ) : (
            <>
              <Button onPress={() => updateNote(note.id, { pinned: !note.pinned })}>
                <Label title={note.pinned ? "Unpin Note" : "Pin Note"} systemImage={note.pinned ? "pin.slash" : "pin"} />
              </Button>
              <Menu title="Move to Folder" systemImage="folder">
                {otherFolders.map((f) => (
                  <Button key={f.id} onPress={() => updateNote(note.id, { folderId: f.id })}>
                    <Label title={f.name} systemImage={f.icon} />
                  </Button>
                ))}
              </Menu>
              <Button onPress={() => switchMode(effectiveMode === "source" ? "edit" : "source")}>
                <Label
                  title={effectiveMode === "source" ? "Formatted Editing" : "Plain Text Editing"}
                  systemImage={effectiveMode === "source" ? "text.badge.star" : "chevron.left.forwardslash.chevron.right"}
                />
              </Button>
              <Divider />
              <Button onPress={() => void navigator.clipboard.writeText(exportText)}>
                <Label title="Copy as Markdown" systemImage="doc.on.doc" />
              </Button>
              <Button onPress={() => setExporting(true)}>
                <Label title="Export…" systemImage="square.and.arrow.up.on.square" />
              </Button>
              <Divider />
              <Button role="destructive" onPress={() => close(() => trashNotes([note.id]))}>
                <Label title="Delete" systemImage="trash" />
              </Button>
            </>
          )}
        </Menu>
      </ToolbarItem>

      {effectiveMode === "source" ? (
        // TextEditor scrolls itself, so it fills the screen instead of sitting in a ScrollView.
        <VStack alignment="leading" spacing={12} padding={{ horizontal: 20, top: 8 }} frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "topLeading" }}>
          {header}
          <TextEditor
            value={body}
            onChange={(text) => change((d) => ({ ...d, lines: relines(d.lines, text) }))}
            onFocus={() => setFocused("source")}
            onBlur={() => setFocused((f) => (f === "source" ? null : f))}
            placeholder="Start writing…"
            scrollContentBackground="hidden"
            font={{ size: 16, design: "monospaced", relativeTo: "body" }}
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
            accessibilityLabel="Body"
            accessibilityIdentifier="note-body"
          />
        </VStack>
      ) : (
        <ScrollView>
          <VStack alignment="leading" spacing={12} padding={{ horizontal: 20, top: 8, bottom: 40 }} frame={{ maxWidth: 720, alignment: "leading" }}>
            {header}

            {effectiveMode === "read" ? (
              <ReadView
                lines={draft.lines.map((l) => l.text)}
                onToggle={deleted ? undefined : toggleLine}
                onLinks={openLinks}
              />
            ) : (
              <VStack
                alignment="leading"
                spacing={6}
                frame={{ maxWidth: "infinity", alignment: "leading" }}
                accessibilityElement="contain"
                accessibilityIdentifier="note-body"
              >
                {draft.lines.map((line, index) =>
                  line.id === editingId ? (
                    <TextField
                      key={line.id}
                      ref={lineField}
                      value={ZWSP + line.text}
                      onChange={(raw) => onLineChange(line, index, raw)}
                    // Return in a vertical field normally arrives as "\n" in onChange
                    // (that's what split() handles); this covers a submit instead.
                    onSubmit={() => submitted(line)}
                    blurOnSubmit={false}
                      onFocus={() => setFocused(line.id)}
                      onBlur={() => {
                        setFocused((f) => (f === line.id ? null : f));
                        setEditingId((e) => (e === line.id ? null : e));
                      }}
                      // ref.focus() from onAppear: the field is on screen by then
                      // (autoFocus waits 350 ms, too slow for moving between lines).
                      onAppear={() => lineField.current?.focus()}
                      axis="vertical"
                      textFieldStyle="plain"
                      font={fieldFont(blocks[index])}
                      fontWeight={blocks[index].kind === "heading" ? "bold" : undefined}
                      accessibilityLabel={`Line ${index + 1}`}
                      accessibilityIdentifier="note-line"
                    />
                  ) : (
                    <HStack
                      key={line.id}
                      frame={{ maxWidth: "infinity", alignment: "leading" }}
                      contentShape="rectangle"
                      onTapGesture={() => edit(line.id)}
                      accessibilityIdentifier="note-line"
                    >
                      <BlockView block={blocks[index]} onToggle={() => toggleLine(index)} />
                    </HStack>
                  ),
                )}
                <Text
                  font="body"
                  foregroundStyle="tertiary"
                  frame={{ maxWidth: "infinity", minHeight: draft.lines.length ? 160 : 240, alignment: "topLeading" }}
                  contentShape="rectangle"
                  onTapGesture={editEnd}
                  accessibilityLabel="Add a line"
                  accessibilityTraits="button"
                >
                  {draft.lines.length ? " " : "Start writing…"}
                </Text>
              </VStack>
            )}
          </VStack>
          <ConfirmationDialog item={linkChoices} onDismiss={() => setLinkChoices(null)} title="Open Link">
            {(urls: string[]) => (
              <>
                {urls.map((url) => (
                  <Button key={url} title={prettyURL(url)} onPress={() => openLink(url)} />
                ))}
                <Button title="Cancel" role="cancel" onPress={() => {}} />
              </>
            )}
          </ConfirmationDialog>
        </ScrollView>
      )}

      {focused !== null && effectiveMode !== "read" ? (
        <FormatBar
          disabled={focused === "title"}
          onFormat={format}
          onDone={doneEditing}
        />
      ) : null}

      <ExportSheet isPresented={exporting} onDismiss={() => setExporting(false)} title={draft.title} body={body} />
      <Alert
        isPresented={confirmingDestroy}
        onDismiss={() => setConfirmingDestroy(false)}
        title="Delete this note permanently?"
        message="You can't undo this."
      >
        <Button title="Delete" role="destructive" onPress={() => close(() => destroyNotes([note.id]))} />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}

function fieldFont(block: Block | undefined): Font {
  if (block?.kind === "heading") return block.level === 1 ? "title" : block.level === 2 ? "title2" : "title3";
  if (block?.kind === "code" || block?.kind === "fence") return { size: 16, design: "monospaced", relativeTo: "callout" };
  return "body";
}

function openLink(url: string) {
  const full = /^[a-z][\w+.-]*:/i.test(url) ? url : `https://${url}`;
  openURL(full, { inApp: /^https?:/i.test(full) });
}

function prettyURL(url: string) {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).replace(/\/$/, "");
  } catch {
    return url;
  }
}

/**
 * Sits at the bottom of the editor, so keyboard avoidance puts it right above
 * the keyboard. (There's no keyboard toolbar placement.)
 */
function FormatBar({ disabled, onFormat, onDone }: { disabled: boolean; onFormat(fn: (line: string) => string): void; onDone(): void }) {
  const tools: { icon: string; label: string; id: string; fn: (line: string) => string }[] = [
    { icon: "textformat.size", label: "Heading", id: "heading", fn: cycleHeading },
    { icon: "bold", label: "Bold", id: "bold", fn: (l) => toggleWrap(l, "**") },
    { icon: "italic", label: "Italic", id: "italic", fn: (l) => toggleWrap(l, "_") },
    { icon: "chevron.left.forwardslash.chevron.right", label: "Code", id: "code", fn: (l) => toggleWrap(l, "`") },
    { icon: "list.bullet", label: "Bulleted list", id: "bullet", fn: toggleBullet },
    { icon: "checklist", label: "Checklist", id: "checklist", fn: toggleTask },
  ];
  return (
    <HStack spacing={2} padding={{ horizontal: 10, vertical: 6 }} background="bar" frame={{ maxWidth: "infinity" }} accessibilityIdentifier="format-bar">
      {tools.map((tool) => (
        <Button
          key={tool.id}
          buttonStyle="borderless"
          disabled={disabled}
          onPress={() => onFormat(tool.fn)}
          accessibilityLabel={tool.label}
          accessibilityIdentifier={`format-${tool.id}`}
        >
          <Image systemName={tool.icon} font="body" frame={{ width: 40, height: 34 }} />
        </Button>
      ))}
      <Spacer />
      <Button buttonStyle="borderless" onPress={onDone} accessibilityLabel="Done editing" accessibilityIdentifier="format-done">
        <Image systemName="keyboard.chevron.compact.down" font="body" frame={{ width: 40, height: 34 }} />
      </Button>
    </HStack>
  );
}
