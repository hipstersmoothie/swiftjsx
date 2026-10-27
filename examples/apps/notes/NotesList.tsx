// The content column: a folder's notes (pinned first), search across every
// note with highlighted matches, sorting, swipe actions, and Recently Deleted.
import { useState } from "react";
import {
  withAnimation, Screen, ToolbarItem, List, Section, VStack, HStack, Text, Image, Button, Label, Menu, Picker, Divider,
  SwipeActions, ContextMenu, Alert, Sheet, Navigator,
} from "swiftjsx";
import {
  useNotes, setSort, updateNote, trashNotes, restoreNote, destroyNotes, inScope, scopeName, daysLeft,
  type Folder, type Note, type Scope, type Sort,
} from "./store";
import { displayTitle, preview, relativeDate, sortNotes, sortLabels, useNow } from "./format";
import { highlight, plainLines, snippet, toMarkdown } from "./markdown";

export function NotesColumn({ scope, selectedId, onOpen, onCompose }: {
  scope: Scope;
  selectedId: string | null;
  onOpen(id: string): void;
  onCompose(): void;
}) {
  const folders = useNotes((s) => s.folders);
  const notes = useNotes((s) => s.notes);
  const sort = useNotes((s) => s.sort);
  const now = useNow();
  const [search, setSearch] = useState("");
  const [moving, setMoving] = useState<Note | null>(null);
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);
  const [destroying, setDestroying] = useState<Note | null>(null);

  const query = search.trim();
  const inFolder = sortNotes(notes.filter((n) => inScope(n, scope)), sort);
  const pinned = scope === "deleted" ? [] : inFolder.filter((n) => n.pinned);
  const others = scope === "deleted" ? inFolder : inFolder.filter((n) => !n.pinned);
  const deletedScope = scope === "deleted";
  const title = scopeName(scope, folders);

  const rowProps = (note: Note) => ({
    note,
    now,
    folders,
    showFolder: scope === "all",
    selected: note.id === selectedId,
    onOpen: () => onOpen(note.id),
    onMove: () => setMoving(note),
    onDestroy: () => setDestroying(note),
  });

  return (
    <Screen title={title} searchText={search} onSearchTextChange={setSearch} searchPrompt="Search all notes">
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="ellipsis.circle" accessibilityLabel="View options" accessibilityIdentifier="list-menu">
          <Picker
            label="Sort By"
            pickerStyle="menu"
            value={sort}
            options={(Object.keys(sortLabels) as Sort[]).map((s) => ({ value: s, label: sortLabels[s] }))}
            onChange={(s) => withAnimation("snappy", () => setSort(s as Sort))}
          />
          {deletedScope ? (
            <>
              <Divider />
              <Button role="destructive" disabled={!inFolder.length} onPress={() => setConfirmingEmpty(true)}>
                <Label title="Delete All" systemImage="trash" />
              </Button>
            </>
          ) : null}
        </Menu>
      </ToolbarItem>
      {deletedScope ? null : (
        <ToolbarItem placement="primaryAction">
          <Button onPress={onCompose} accessibilityLabel="New Note" accessibilityIdentifier="new-note">
            <Image systemName="square.and.pencil" />
          </Button>
        </ToolbarItem>
      )}

      {query ? (
        <SearchResults query={query} now={now} folders={folders} selectedId={selectedId} onOpen={onOpen} />
      ) : (
        <List>
          {pinned.length ? (
            <Section header="Pinned">
              {pinned.map((note) => (
                <NoteRow key={note.id} {...rowProps(note)} />
              ))}
            </Section>
          ) : null}
          <Section
            header={pinned.length ? "Notes" : undefined}
            footer={
              deletedScope
                ? "Notes are deleted for good 30 days after you delete them."
                : `${inFolder.length} ${inFolder.length === 1 ? "note" : "notes"} · sorted by ${sortLabels[sort].toLowerCase()}`
            }
          >
            {others.map((note) => (
              <NoteRow key={note.id} {...rowProps(note)} />
            ))}
          </Section>
          {inFolder.length ? null : (
            <Section>
              <EmptyState
                icon={deletedScope ? "trash" : "note.text"}
                title={deletedScope ? "No Deleted Notes" : "No Notes"}
                message={deletedScope ? "Notes you delete stay here for 30 days." : "Tap the compose button to write one."}
              />
            </Section>
          )}
        </List>
      )}

      <Sheet item={moving} onDismiss={() => setMoving(null)} detents={["medium", "large"]}>
        {(note: Note) => (
          <Navigator>
            <MoveForm note={note} folders={folders} onClose={() => setMoving(null)} />
          </Navigator>
        )}
      </Sheet>
      <Alert
        isPresented={confirmingEmpty}
        onDismiss={() => setConfirmingEmpty(false)}
        title={`Delete ${inFolder.length} ${inFolder.length === 1 ? "note" : "notes"} permanently?`}
        message="You can't undo this."
      >
        <Button title="Delete All" role="destructive" onPress={() => withAnimation("snappy", () => destroyNotes(inFolder.map((n) => n.id)))} />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
      <Alert item={destroying} onDismiss={() => setDestroying(null)} title={(n: Note) => `Delete “${displayTitle(n)}” permanently?`} message="You can't undo this.">
        {(note: Note) => (
          <>
            <Button title="Delete" role="destructive" onPress={() => withAnimation("snappy", () => destroyNotes([note.id]))} />
            <Button title="Cancel" role="cancel" onPress={() => {}} />
          </>
        )}
      </Alert>
    </Screen>
  );
}

function NoteRow({ note, now, folders, showFolder, selected, onOpen, onMove, onDestroy }: {
  note: Note;
  now: number;
  folders: Folder[];
  showFolder: boolean;
  selected: boolean;
  onOpen(): void;
  onMove(): void;
  onDestroy(): void;
}) {
  const deleted = note.deletedAt !== null;
  const folder = folders.find((f) => f.id === note.folderId);
  const title = displayTitle(note);
  const date = relativeDate(note.updatedAt, now);
  const togglePin = () => withAnimation("snappy", () => updateNote(note.id, { pinned: !note.pinned }));
  const trash = () => withAnimation("snappy", () => trashNotes([note.id]));
  const restore = () => withAnimation("snappy", () => restoreNote(note.id));

  return (
    <Button
      onPress={onOpen}
      tint="primary"
      listRowBackground={selected ? "orange/15" : undefined}
      accessibilityLabel={title}
      accessibilityValue={`${date}, ${preview(note)}`}
      accessibilityTraits={selected ? ["button", "selected"] : "button"}
      accessibilityIdentifier="note-row"
    >
      <VStack alignment="leading" spacing={3} padding={{ vertical: 2 }}>
        <Text font="headline" lineLimit={1}>{title}</Text>
        <Text font="subheadline" lineLimit={1}>
          <Text foregroundStyle="primary">{deleted ? `${daysLeft(note, now)} days` : date}</Text>
          <Text foregroundStyle="secondary">{"  " + preview(note)}</Text>
        </Text>
        {showFolder && folder ? (
          <Label title={folder.name} systemImage={folder.icon} font="caption" foregroundStyle="secondary" />
        ) : null}
      </VStack>

      {deleted ? (
        <>
          <SwipeActions edge="leading" allowsFullSwipe>
            <Button tint="blue" onPress={restore}>
              <Label title="Recover" systemImage="arrow.uturn.backward" />
            </Button>
          </SwipeActions>
          <SwipeActions edge="trailing">
            <Button tint="red" onPress={onDestroy}>
              <Label title="Delete" systemImage="trash" />
            </Button>
          </SwipeActions>
          <ContextMenu>
            <Button onPress={restore}>
              <Label title="Recover" systemImage="arrow.uturn.backward" />
            </Button>
            <Button role="destructive" onPress={onDestroy}>
              <Label title="Delete Permanently" systemImage="trash" />
            </Button>
          </ContextMenu>
        </>
      ) : (
        <>
          <SwipeActions edge="leading" allowsFullSwipe>
            <Button tint="orange" onPress={togglePin}>
              <Label title={note.pinned ? "Unpin" : "Pin"} systemImage={note.pinned ? "pin.slash.fill" : "pin.fill"} />
            </Button>
          </SwipeActions>
          {/* Deleting is undoable (Recently Deleted), so the row can go right away. */}
          <SwipeActions edge="trailing" allowsFullSwipe>
            <Button role="destructive" onPress={trash}>
              <Label title="Delete" systemImage="trash" />
            </Button>
            <Button tint="indigo" onPress={onMove}>
              <Label title="Move" systemImage="folder" />
            </Button>
          </SwipeActions>
          <ContextMenu>
            <Button onPress={togglePin}>
              <Label title={note.pinned ? "Unpin Note" : "Pin Note"} systemImage={note.pinned ? "pin.slash" : "pin"} />
            </Button>
            <Menu title="Move to Folder" systemImage="folder">
              {folders
                .filter((f) => f.id !== note.folderId)
                .map((f) => (
                  <Button key={f.id} onPress={() => updateNote(note.id, { folderId: f.id })}>
                    <Label title={f.name} systemImage={f.icon} />
                  </Button>
                ))}
            </Menu>
            <Button onPress={() => void navigator.clipboard.writeText(toMarkdown(note.title, note.body))}>
              <Label title="Copy" systemImage="doc.on.doc" />
            </Button>
            <Divider />
            <Button role="destructive" onPress={trash}>
              <Label title="Delete" systemImage="trash" />
            </Button>
          </ContextMenu>
        </>
      )}
    </Button>
  );
}

/** Every note (not just this folder) matching `query`, with the matches highlighted. */
function SearchResults({ query, now, folders, selectedId, onOpen }: {
  query: string;
  now: number;
  folders: Folder[];
  selectedId: string | null;
  onOpen(id: string): void;
}) {
  const notes = useNotes((s) => s.notes);
  const q = query.toLowerCase();
  const results = sortNotes(notes.filter((n) => n.deletedAt === null), "edited").flatMap((note) => {
    const title = displayTitle(note);
    const text = plainLines(note.body).join(" ");
    const inTitle = title.toLowerCase().includes(q);
    const excerpt = snippet(text, query);
    return inTitle || excerpt ? [{ note, title, excerpt: excerpt ?? preview(note) }] : [];
  });

  return (
    <List>
      <Section header={`${results.length} ${results.length === 1 ? "result" : "results"}`}>
        {results.map(({ note, title, excerpt }) => {
          const folder = folders.find((f) => f.id === note.folderId);
          return (
            <Button
              key={note.id}
              onPress={() => onOpen(note.id)}
              tint="primary"
              listRowBackground={note.id === selectedId ? "orange/15" : undefined}
              accessibilityLabel={title}
              accessibilityIdentifier="note-row"
            >
              <VStack alignment="leading" spacing={3} padding={{ vertical: 2 }}>
                <Highlighted text={title} query={query} font="headline" lineLimit={1} />
                <Highlighted text={excerpt} query={query} font="subheadline" lineLimit={3} dim />
                <Text font="caption" foregroundStyle="secondary">
                  {`${relativeDate(note.updatedAt, now)}${folder ? ` · ${folder.name}` : ""}`}
                </Text>
              </VStack>
            </Button>
          );
        })}
      </Section>
      {results.length ? null : (
        <Section>
          <EmptyState icon="magnifyingglass" title="No Results" message={`No notes contain “${query}”.`} />
        </Section>
      )}
    </List>
  );
}

/**
 * Runs can't have a background (an AttributedString highlight), so matches
 * are bold, orange and underlined instead of marker-yellow.
 */
function Highlighted({ text, query, font, lineLimit, dim }: {
  text: string;
  query: string;
  font: "headline" | "subheadline";
  lineLimit: number;
  dim?: boolean;
}) {
  return (
    <Text font={font} lineLimit={lineLimit} foregroundStyle={dim ? "secondary" : undefined}>
      {highlight(text, query).map((run, i) =>
        run.match ? (
          <Text key={i} bold foregroundStyle="orange" underline="orange">
            {run.text}
          </Text>
        ) : (
          <Text key={i}>{run.text}</Text>
        ),
      )}
    </Text>
  );
}

function MoveForm({ note, folders, onClose }: { note: Note; folders: Folder[]; onClose(): void }) {
  return (
    <Screen title="Move to Folder" titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={onClose} />
      </ToolbarItem>
      <List>
        <Section footer={`“${displayTitle(note)}”`}>
          {folders.map((f) => (
            <Button
              key={f.id}
              tint="primary"
              disabled={f.id === note.folderId}
              onPress={() => {
                withAnimation("snappy", () => updateNote(note.id, { folderId: f.id }));
                onClose();
              }}
            >
              <HStack spacing={12}>
                <Image systemName={f.icon} foregroundStyle="orange" frame={{ width: 26 }} />
                <Text>{f.name}</Text>
                {f.id === note.folderId ? <Image systemName="checkmark" foregroundStyle="orange" frame={{ maxWidth: "infinity", alignment: "trailing" }} /> : null}
              </HStack>
            </Button>
          ))}
        </Section>
      </List>
    </Screen>
  );
}

function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <VStack spacing={8} padding={{ vertical: 28 }} frame={{ maxWidth: "infinity" }} accessibilityElement="combine">
      <Image systemName={icon} font="largeTitle" foregroundStyle="tertiary" />
      <Text font="headline">{title}</Text>
      <Text font="subheadline" foregroundStyle="secondary" textAlignment="center">{message}</Text>
    </VStack>
  );
}
