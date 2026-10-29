// The sidebar: All Notes, the folders (with counts), Recently Deleted, and
// how much local storage the notes take.
import { useState } from "react";
import {
  withAnimation, Navigator, Screen, ToolbarItem, List, Section, Form, HStack, Text, Image, TextField, Button, Label,
  LazyVGrid, SwipeActions, ContextMenu, Alert, Sheet, format, type Fill,
} from "swiftjsx";
import {
  useNotes, useStorageSize, addFolder, deleteFolder, inScope, sameScope, DEFAULT_FOLDER, type Folder, type Scope,
} from "./store";

export function FoldersColumn({ scope, highlight, onSelect }: { scope: Scope; highlight: boolean; onSelect(scope: Scope): void }) {
  const folders = useNotes((s) => s.folders);
  const notes = useNotes((s) => s.notes);
  const bytes = useStorageSize();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Folder | null>(null);

  const count = (s: Scope) => notes.filter((n) => inScope(n, s)).length;
  const deletingCount = deleting ? count({ folderId: deleting.id }) : 0;

  const remove = (folder: Folder) => {
    if (sameScope(scope, { folderId: folder.id })) onSelect("all");
    withAnimation("snappy", () => deleteFolder(folder.id));
  };

  return (
    <Screen title="Folders">
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => setCreating(true)} accessibilityLabel="New Folder" accessibilityIdentifier="new-folder">
          <Image systemName="folder.badge.plus" />
        </Button>
      </ToolbarItem>

      <List listStyle="insetGrouped">
        <Section>
          <FolderRow name="All Notes" icon="tray.full" count={count("all")} selected={highlight && scope === "all"} onPress={() => onSelect("all")} />
        </Section>
        <Section header="Folders">
          {folders.map((folder) => {
            const s: Scope = { folderId: folder.id };
            return (
              <FolderRow
                key={folder.id}
                name={folder.name}
                icon={folder.icon}
                count={count(s)}
                selected={highlight && sameScope(scope, s)}
                onPress={() => onSelect(s)}
                onDelete={folder.id === DEFAULT_FOLDER ? undefined : () => setDeleting(folder)}
              />
            );
          })}
        </Section>
        <Section footer={`Notes use ${format.bytes(bytes)} of local storage.`}>
          <FolderRow
            name="Recently Deleted"
            icon="trash"
            iconColor="red"
            count={count("deleted")}
            selected={highlight && scope === "deleted"}
            onPress={() => onSelect("deleted")}
          />
        </Section>
      </List>

      <Sheet isPresented={creating} onDismiss={() => setCreating(false)} detents={["medium", "large"]}>
        <Navigator>
          <NewFolderForm
            onClose={() => setCreating(false)}
            onCreate={(id) => onSelect({ folderId: id })}
          />
        </Navigator>
      </Sheet>
      <Alert
        item={deleting}
        onDismiss={() => setDeleting(null)}
        title={(f: Folder) => `Delete “${f.name}”?`}
        message={() => (deletingCount ? format.count(deletingCount, { one: "Its # note moves to Recently Deleted.", other: "Its # notes move to Recently Deleted." }) : "The folder is empty.")}
      >
        {(folder: Folder) => (
          <>
            <Button title="Delete Folder" role="destructive" onPress={() => remove(folder)} />
            <Button title="Cancel" role="cancel" onPress={() => {}} />
          </>
        )}
      </Alert>
    </Screen>
  );
}

function FolderRow({ name, icon, iconColor = "orange", count, selected, onPress, onDelete }: {
  name: string;
  icon: string;
  iconColor?: Fill;
  count: number;
  selected: boolean;
  onPress(): void;
  onDelete?: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      tint="primary"
      listRowBackground={selected ? "orange/15" : undefined}
      badge={count}
      accessibilityLabel={name}
      accessibilityValue={format.count(count, { one: "# note", other: "# notes" })}
      accessibilityTraits={selected ? ["button", "selected"] : "button"}
      accessibilityIdentifier="folder-row"
    >
      <HStack spacing={12}>
        <Image systemName={icon} foregroundStyle={iconColor} frame={{ width: 26 }} />
        <Text>{name}</Text>
      </HStack>
      {onDelete ? (
        <>
          {/* tint, not role="destructive": that would remove the row before the alert confirms. */}
          <SwipeActions edge="trailing">
            <Button tint="red" onPress={onDelete}>
              <Label title="Delete" systemImage="trash" />
            </Button>
          </SwipeActions>
          <ContextMenu>
            <Button role="destructive" onPress={onDelete}>
              <Label title="Delete Folder" systemImage="trash" />
            </Button>
          </ContextMenu>
        </>
      ) : null}
    </Button>
  );
}

const icons = [
  "folder", "briefcase", "house", "lightbulb", "book", "graduationcap", "cart", "heart",
  "airplane", "leaf", "star", "music.note", "fork.knife", "dumbbell", "pawprint", "gamecontroller",
];

function NewFolderForm({ onClose, onCreate }: { onClose(): void; onCreate(id: string): void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder");
  const trimmed = name.trim();

  const save = () => {
    if (!trimmed) return;
    const id = withAnimation("snappy", () => addFolder(trimmed, icon));
    onClose();
    onCreate(id);
  };

  return (
    <Screen title="New Folder" titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={onClose} />
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        <Button title="Done" fontWeight="semibold" disabled={!trimmed} onPress={save} />
      </ToolbarItem>
      <Form>
        <Section>
          <TextField
            value={name}
            onChange={setName}
            onSubmit={save}
            placeholder="Name"
            autoFocus
            autocapitalize="words"
            submitLabel="done"
            textFieldStyle="plain"
            accessibilityLabel="Folder name"
            accessibilityIdentifier="new-folder-name"
          />
        </Section>
        <Section header="Icon">
          <LazyVGrid columns={{ minimum: 44 }} spacing={12}>
            {icons.map((name) => (
              <Image
                key={name}
                systemName={name}
                font="title3"
                foregroundStyle={name === icon ? "white" : "orange"}
                frame={{ width: 44, height: 44 }}
                background={name === icon ? "orange" : "orange/12"}
                cornerRadius={22}
                onTapGesture={() => setIcon(name)}
                accessibilityLabel={name.replace(/\./g, " ")}
                accessibilityTraits={name === icon ? ["button", "selected"] : "button"}
              />
            ))}
          </LazyVGrid>
        </Section>
      </Form>
    </Screen>
  );
}
