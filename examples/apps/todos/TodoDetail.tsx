import { useState } from "react";
import { format } from "date-fns";
import {
  useNavigation, Screen, Form, Section, TextField, Toggle, Picker, Button, ConfirmationDialog,
} from "swiftjsx";
import { useTodos, updateTodo, deleteTodos } from "./store";
import { dueOptions, useToday } from "./dates";

/** Edits one todo. Changes save as you make them. */
export function TodoDetail({ id }: { id: string }) {
  const nav = useNavigation();
  const today = useToday();
  const todo = useTodos((s) => s.todos.find((t) => t.id === id));
  const lists = useTodos((s) => s.lists);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!todo) return <Screen title="Details" titleDisplayMode="inline" />;

  return (
    <Screen title="Details" titleDisplayMode="inline">
      <Form>
        <Section>
          <TextField value={todo.title} onChange={(title) => updateTodo(id, { title })} placeholder="Title" accessibilityLabel="Title" />
          <TextField value={todo.notes} onChange={(notes) => updateTodo(id, { notes })} placeholder="Notes" accessibilityLabel="Notes" />
        </Section>
        <Section>
          <Toggle label="Completed" value={todo.done} onChange={(done) => updateTodo(id, { done })} />
          <Toggle label="Flagged" tint="orange" value={todo.flagged} onChange={(flagged) => updateTodo(id, { flagged })} />
        </Section>
        <Section footer={`Created ${format(todo.createdAt, "PPP 'at' p")}`}>
          <Picker
            label="Due"
            pickerStyle="menu"
            value={todo.due === null ? "none" : String(todo.due)}
            options={dueOptions(todo.due, today)}
            onChange={(value) => updateTodo(id, { due: value === "none" ? null : Number(value) })}
          />
          <Picker
            label="List"
            pickerStyle="menu"
            value={todo.listId}
            options={lists.map((l) => ({ value: l.id, label: l.name }))}
            onChange={(listId) => updateTodo(id, { listId })}
          />
        </Section>
        <Section>
          <Button title="Delete Todo" role="destructive" onPress={() => setConfirmingDelete(true)}>
            <ConfirmationDialog isPresented={confirmingDelete} onDismiss={() => setConfirmingDelete(false)} title="Delete this todo?">
              <Button
                title="Delete Todo"
                role="destructive"
                onPress={() => {
                  nav.pop();
                  deleteTodos([id]);
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
