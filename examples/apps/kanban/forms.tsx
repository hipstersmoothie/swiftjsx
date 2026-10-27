// Sheets for creating and editing boards and columns. Each renders inside its
// own <Navigator>, for a title and Cancel / Save buttons.
import { useState } from "react";
import {
  Screen, ToolbarItem, Form, Section, TextField, Button, VStack, HStack, Text, Image, Picker, ScrollView, Alert, type Color,
} from "swiftjsx";
import { boardColorNames, boardColors, boardSymbols, swatches, type Board, type BoardColor } from "./model";
import { addBoard, addColumn, deleteColumn, updateBoardInfo, updateColumn, useBoard } from "./store";
import { BoardIcon, Dot, SwatchPicker } from "./ui";

const templates = {
  kanban: { label: "To do · In progress · Review · Done", columns: ["To do", "In progress", "Review", "Done"] },
  simple: { label: "To do · Doing · Done", columns: ["To do", "Doing", "Done"] },
  software: { label: "Backlog · Ready · In progress · Review · Done", columns: ["Backlog", "Ready", "In progress", "Review", "Done"] },
  empty: { label: "No columns", columns: [] as string[] },
};
type Template = keyof typeof templates;

/** New board (no `board`), or edit one. `onDone` gets the new board's id. */
export function BoardForm({ board, onDone }: { board?: Board; onDone(createdId?: string): void }) {
  const [name, setName] = useState(board?.name ?? "");
  const [color, setColor] = useState<BoardColor>(board?.color ?? "indigo");
  const [symbol, setSymbol] = useState(board?.symbol ?? boardSymbols[0]);
  const [template, setTemplate] = useState<Template>("kanban");
  const valid = name.trim().length > 0;

  const save = () => {
    if (!valid) return;
    if (board) {
      updateBoardInfo(board.id, { name: name.trim(), color, symbol });
      onDone();
    } else {
      const id = addBoard(name.trim(), color, symbol, templates[template].columns);
      onDone(id);
    }
  };

  return (
    <Screen title={board ? "Edit Board" : "New Board"} titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={() => onDone()} />
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        <Button title={board ? "Save" : "Create"} onPress={save} disabled={!valid} accessibilityIdentifier="save-board" />
      </ToolbarItem>
      <Form>
        <Section>
          <VStack spacing={10} padding={{ vertical: 10 }} frame={{ maxWidth: "infinity" }}>
            <BoardIcon color={color} symbol={symbol} size={72} />
            <Text font="title3" fontWeight="semibold" foregroundStyle={valid ? "primary" : "secondary"}>
              {name.trim() || "New Board"}
            </Text>
          </VStack>
        </Section>
        <Section header="Name">
          <TextField value={name} onChange={setName} placeholder="e.g. Q3 Roadmap" onSubmit={save} autoFocus={!board} textFieldStyle="plain" accessibilityIdentifier="board-name" />
        </Section>
        <Section header="Color">
          <ScrollView axis="horizontal" spacing={12}>
            {boardColorNames.map((c) => (
              <Image
                key={c}
                systemName="checkmark"
                font="footnote"
                fontWeight="bold"
                foregroundStyle={c === color ? "white" : "clear"}
                frame={{ width: 34, height: 34 }}
                background={{ gradient: boardColors[c].gradient, start: "topLeading", end: "bottomTrailing" }}
                cornerRadius="capsule"
                padding={{ vertical: 6 }}
                scale={c === color ? 1.1 : 1}
                animation="snappy"
                onTapGesture={() => setColor(c)}
                accessibilityLabel={boardColors[c].name}
                accessibilityTraits={c === color ? ["button", "selected"] : "button"}
              />
            ))}
          </ScrollView>
        </Section>
        <Section header="Icon">
          <ScrollView axis="horizontal" spacing={10}>
            {boardSymbols.map((s) => (
              <Image
                key={s}
                systemName={s}
                font="title3"
                foregroundStyle={s === symbol ? "white" : boardColors[color].tint}
                frame={{ width: 44, height: 44 }}
                background={s === symbol ? boardColors[color].tint : "tertiarySystemFill"}
                cornerRadius={11}
                padding={{ vertical: 4 }}
                onTapGesture={() => setSymbol(s)}
                accessibilityLabel={s}
                accessibilityTraits={s === symbol ? ["button", "selected"] : "button"}
              />
            ))}
          </ScrollView>
        </Section>
        {board ? null : (
          <Section header="Columns">
            <Picker
              label="Template"
              pickerStyle="inline"
              value={template}
              onChange={(t) => setTemplate(t as Template)}
              options={(Object.keys(templates) as Template[]).map((t) => ({ value: t, label: templates[t].label }))}
            />
          </Section>
        )}
      </Form>
    </Screen>
  );
}

/** New column (no `columnId`), or edit one. `onDone(true)` after adding. */
export function ColumnForm({ boardId, columnId, onDone }: { boardId: string; columnId: string | null; onDone(added: boolean): void }) {
  const board = useBoard(boardId);
  const column = board?.columns.find((c) => c.id === columnId);
  const [name, setName] = useState(column?.name ?? "");
  const [color, setColor] = useState<Color>(column?.color ?? "blue");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const valid = name.trim().length > 0;
  const cards = column ? column.cardIds.length : 0;

  const save = () => {
    if (!valid) return;
    if (column) updateColumn(boardId, column.id, { name: name.trim(), color });
    else addColumn(boardId, name.trim(), color);
    onDone(!column);
  };

  return (
    <Screen title={column ? "Edit Column" : "New Column"} titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={() => onDone(false)} />
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        <Button title={column ? "Save" : "Add"} onPress={save} disabled={!valid} accessibilityIdentifier="save-column" />
      </ToolbarItem>
      <Form>
        <Section header="Name">
          <HStack spacing={10}>
            <Dot color={color} size={12} />
            <TextField value={name} onChange={setName} placeholder="e.g. Blocked" onSubmit={save} autoFocus textFieldStyle="plain" accessibilityIdentifier="column-name" />
          </HStack>
        </Section>
        <Section header="Color">
          <SwatchPicker colors={swatches} value={color} onChange={setColor} />
        </Section>
        {column ? (
          <Section footer={cards ? `Deleting it also deletes its ${cards} card${cards === 1 ? "" : "s"}. Archive it from the column's menu to keep them.` : undefined}>
            <Button title="Delete Column" role="destructive" onPress={() => setConfirmingDelete(true)} />
          </Section>
        ) : null}
      </Form>
      <Alert
        isPresented={confirmingDelete}
        onDismiss={() => setConfirmingDelete(false)}
        title={`Delete "${column?.name}"?`}
        message={cards ? `Its ${cards} card${cards === 1 ? "" : "s"} will be deleted too.` : undefined}
      >
        <Button
          title="Delete"
          role="destructive"
          onPress={() => {
            onDone(false);
            if (column) deleteColumn(boardId, column.id);
          }}
        />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}
