// A notes app (like Apple Notes / Bear): folders → notes → editor in a
// three-column NavigationSplitView (a stack on iPhone), lightweight markdown
// with a live-preview editor and a read mode, search with highlighted
// matches, pinning, Recently Deleted, and export. Persisted with zustand +
// localStorage.
import { useEffect, useState } from "react";
import { NavigationSplitView } from "swiftjsx";
import { createNote, purgeExpired, DEFAULT_FOLDER, type Scope } from "./store";
import { FoldersColumn } from "./Folders";
import { NotesColumn } from "./NotesList";
import { NoteDetail, NoNoteSelected } from "./Editor";

type Column = "sidebar" | "content" | "detail";

export function NotesApp() {
  const [scope, setScope] = useState<Scope>("all");
  const [noteId, setNoteId] = useState<string | null>(null);
  // On iPhone, start on the notes list (back goes to the folders), like Notes.
  const [column, setColumn] = useState<Column>("content");
  const [composedId, setComposedId] = useState<string | null>(null);

  useEffect(() => {
    purgeExpired(Date.now());
  }, []);

  const openScope = (next: Scope) => {
    setScope(next);
    setColumn("content");
  };
  const openNote = (id: string, composed = false) => {
    setNoteId(id);
    setComposedId(composed ? id : null);
    setColumn("detail");
  };
  const compose = () => openNote(createNote(typeof scope === "string" ? DEFAULT_FOLDER : scope.folderId), true);
  const closeNote = () => {
    setNoteId(null);
    setColumn("content");
  };

  // Selection highlights. JS can't tell whether the columns are side by side
  // (no size class), and on iPhone a highlight would linger after going back,
  // so only highlight what's "ahead" of the column on screen. (On iPad the
  // column stays where the last selection put it.)
  const highlightedNote = column === "detail" ? noteId : null;
  const highlightFolder = column !== "sidebar";

  return (
    <NavigationSplitView
      sidebar={<FoldersColumn scope={scope} highlight={highlightFolder} onSelect={openScope} />}
      content={<NotesColumn scope={scope} selectedId={highlightedNote} onOpen={(id) => openNote(id)} onCompose={compose} />}
      detail={
        noteId ? (
          // Keyed: each note gets a fresh editor (its own draft and autosave).
          <NoteDetail key={noteId} id={noteId} autoFocusTitle={noteId === composedId} onClose={closeNote} />
        ) : (
          <NoNoteSelected />
        )
      }
      preferredCompactColumn={column}
      onPreferredCompactColumnChange={setColumn}
    />
  );
}
