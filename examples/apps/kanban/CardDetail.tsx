// The card sheet: edit everything about a card. Changes save as you type.
import { useState } from "react";
import { addDays, differenceInCalendarDays, format as formatDate, startOfDay } from "date-fns";
import {
  Screen, ToolbarItem, Form, Section, TextField, Picker, Toggle, DatePicker, Button, HStack, Text, Image, ProgressView, Flow,
  SwipeActions, ConfirmationDialog, Label, withAnimation, useToday, format, type Color,
} from "swiftjsx";
import { activeColumns, dueLabel, members, type ChecklistItem } from "./model";
import {
  addChecklistItem, deleteCard, moveCard, removeChecklistItem, setCardArchived, toggleLabel, updateCard, updateChecklistItem, useBoard,
} from "./store";

type Props = { boardId: string; cardId: string; onClose(): void };

export function CardDetail({ boardId, cardId, onClose }: Props) {
  const board = useBoard(boardId);
  const today = useToday();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const card = board?.cards[cardId];

  if (!board || !card) {
    return (
      <Screen title="Card" titleDisplayMode="inline">
        <ToolbarItem placement="confirmationAction">
          <Button title="Done" onPress={onClose} />
        </ToolbarItem>
      </Screen>
    );
  }

  const column = board.columns.find((c) => c.id === card.columnId);
  const columns = activeColumns(board);
  const done = card.checklist.filter((i) => i.done).length;
  const update = (changes: Parameters<typeof updateCard>[2]) => updateCard(boardId, cardId, changes);

  return (
    <Screen title={column ? column.name : "Card"} titleDisplayMode="inline">
      <ToolbarItem placement="confirmationAction">
        <Button title="Done" onPress={onClose} accessibilityIdentifier="close-card" />
      </ToolbarItem>

      <Form>
        <Section>
          <TextField
            value={card.title}
            onChange={(title) => update({ title })}
            placeholder="Title"
            font="headline"
            textFieldStyle="plain"
            axis="vertical"
            maxLines={4}
            accessibilityIdentifier="card-title"
          />
          <TextField
            value={card.description}
            onChange={(description) => update({ description })}
            placeholder="Add a description…"
            textFieldStyle="plain"
            axis="vertical"
            minLines={3}
            maxLines={12}
            accessibilityIdentifier="card-description"
          />
        </Section>

        <Section header="Status">
          <Picker
            label="Column"
            pickerStyle="menu"
            value={card.archived ? "" : card.columnId}
            options={[...(card.archived ? [{ value: "", label: "Archived" }] : []), ...columns.map((c) => ({ value: c.id, label: c.name }))]}
            onChange={(columnId) => {
              if (!columnId) return;
              if (card.archived) setCardArchived(boardId, cardId, false);
              moveCard(boardId, cardId, columnId, null);
            }}
            accessibilityIdentifier="card-column"
          />
          <Picker
            label="Assignee"
            pickerStyle="menu"
            value={card.assigneeId ?? ""}
            options={[{ value: "", label: "Nobody" }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
            onChange={(assigneeId) => update({ assigneeId: assigneeId || null })}
            accessibilityIdentifier="card-assignee"
          />
          <DueDate due={card.due} today={today} onChange={(due) => update({ due })} />
        </Section>

        <Section header="Labels" footer="Tap to add or remove. Labels show on the card and work as board filters.">
          <Flow spacing={8} padding={{ vertical: 6 }}>
            {board.labels.map((label) => {
              const on = card.labelIds.includes(label.id);
              return (
                <HStack
                  key={label.id}
                  spacing={5}
                  padding={{ horizontal: 12, vertical: 6 }}
                  background={on ? label.color : (`${label.color}/12` as Color)}
                  foregroundStyle={on ? "white" : label.color}
                  cornerRadius="capsule"
                  animation="snappy"
                  onTapGesture={() => toggleLabel(boardId, cardId, label.id)}
                  accessibilityElement="combine"
                  accessibilityTraits={on ? ["button", "selected"] : "button"}
                  accessibilityIdentifier={`label-${label.name}`}
                >
                  <Image systemName={on ? "checkmark" : "plus"} font="caption2" fontWeight="bold" />
                  <Text font="subheadline" fontWeight="semibold">{label.name}</Text>
                </HStack>
              );
            })}
          </Flow>
        </Section>

        <Section header={card.checklist.length ? `Checklist · ${done}/${card.checklist.length}` : "Checklist"}>
          {card.checklist.length ? <ProgressView value={done} total={card.checklist.length} tint={done === card.checklist.length ? "green" : "accent"} /> : null}
          {card.checklist.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={() => updateChecklistItem(boardId, cardId, item.id, { done: !item.done })}
              onRename={(text) => updateChecklistItem(boardId, cardId, item.id, { text })}
              onRemove={() => withAnimation("default", () => removeChecklistItem(boardId, cardId, item.id))}
            />
          ))}
          <NewChecklistItem onAdd={(text) => addChecklistItem(boardId, cardId, text)} />
        </Section>

        <Section footer={`Created ${formatDate(card.createdAt, "PPP 'at' p")}`}>
          {card.archived ? (
            <Button onPress={() => setCardArchived(boardId, cardId, false)} accessibilityIdentifier="restore-card">
              <Label title="Restore to Board" systemImage="tray.and.arrow.up" />
            </Button>
          ) : (
            <Button
              onPress={() => {
                onClose();
                setCardArchived(boardId, cardId, true);
              }}
              accessibilityIdentifier="archive-card"
            >
              <Label title="Archive Card" systemImage="archivebox" />
            </Button>
          )}
          <Button role="destructive" onPress={() => setConfirmingDelete(true)} accessibilityIdentifier="delete-card">
            <Label title="Delete Card" systemImage="trash" />
            <ConfirmationDialog isPresented={confirmingDelete} onDismiss={() => setConfirmingDelete(false)} title="Delete this card?" message="This can't be undone. Archive it to keep it around.">
              <Button
                title="Delete Card"
                role="destructive"
                onPress={() => {
                  onClose();
                  deleteCard(boardId, cardId);
                }}
              />
              <Button title="Cancel" role="cancel" onPress={() => {}} />
            </ConfirmationDialog>
          </Button>
        </Section>
      </Form>
    </Screen>
  );
}

/** A toggle for whether there's a due date, then the date. Dates are kept as the start of their day. */
function DueDate({ due, today, onChange }: { due: number | null; today: number; onChange(due: number | null): void }) {
  const label = due === null ? null : dueLabel(due, today);
  const days = due === null ? 0 : differenceInCalendarDays(due, today);
  return (
    <>
      <Toggle
        value={due !== null}
        onChange={(on) => onChange(on ? addDays(today, 1).getTime() : null)}
        accessibilityIdentifier="card-has-due"
      >
        <HStack spacing={8}>
          <Image systemName="calendar" foregroundStyle={label?.tone === "overdue" ? "red" : "accent"} />
          <Text>Due date</Text>
          {due !== null ? (
            <Text font="caption" foregroundStyle={label?.tone === "overdue" ? "red" : "secondary"}>
              {days === 0 ? "today" : days > 0 ? format.count(days, { one: "in # day", other: "in # days" }) : format.count(-days, { one: "# day overdue", other: "# days overdue" })}
            </Text>
          ) : null}
        </HStack>
      </Toggle>
      {due !== null ? (
        <DatePicker
          label="Date"
          value={due}
          onChange={(date) => onChange(startOfDay(date).getTime())}
          accessibilityIdentifier="card-due"
        />
      ) : null}
    </>
  );
}

function ChecklistRow({ item, onToggle, onRename, onRemove }: { item: ChecklistItem; onToggle(): void; onRename(text: string): void; onRemove(): void }) {
  return (
    <HStack spacing={10}>
      <Image
        systemName={item.done ? "checkmark.circle.fill" : "circle"}
        font="title3"
        foregroundStyle={item.done ? "green" : "tertiaryLabel"}
        onTapGesture={onToggle}
        accessibilityLabel={item.done ? "Done" : "Not done"}
        accessibilityTraits="button"
        accessibilityIdentifier="checklist-toggle"
      />
      <TextField value={item.text} onChange={onRename} placeholder="Item" textFieldStyle="plain" foregroundStyle={item.done ? "secondary" : "primary"} />
      <SwipeActions edge="trailing">
        <Button role="destructive" onPress={onRemove}>
          <Label title="Delete" systemImage="trash" />
        </Button>
      </SwipeActions>
    </HStack>
  );
}

function NewChecklistItem({ onAdd }: { onAdd(text: string): void }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  };
  return (
    <HStack spacing={10}>
      <Image systemName="plus.circle" font="title3" foregroundStyle="accent" accessibilityHidden />
      <TextField value={text} onChange={setText} placeholder="Add an item" onSubmit={add} blurOnSubmit={false} submitLabel="done" textFieldStyle="plain" accessibilityIdentifier="new-checklist-item" />
    </HStack>
  );
}
