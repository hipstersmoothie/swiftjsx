import { useRef, useState } from "react";
import {
  withAnimation, Screen, ToolbarItem, List, Section, Picker, HStack, VStack, Text, Image, TextField, Button,
  ConfirmationDialog, type Color, type HostInstance,
} from "swiftjsx";
import { useTodos, addTodo, deleteTodos, inScope, matchesSearch, scopeName, smartLists, sortTodos, type Scope } from "./store";
import { useToday } from "./dates";
import { TodoRow } from "./TodoRow";

type Filter = "all" | "active" | "done";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "done", label: "Done" },
];

/** One list, or a smart list (Today, Flagged, All). */
export function TodosScreen({ scope }: { scope: Scope }) {
  const today = useToday();
  const lists = useTodos((s) => s.lists);
  const todos = useTodos((s) => s.todos);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);

  const query = search.trim().toLowerCase();
  const scoped = todos.filter((t) => inScope(t, scope, today));
  const completed = scoped.filter((t) => t.done);
  const visible = sortTodos(scoped.filter((t) => (filter === "all" || t.done === (filter === "done")) && matchesSearch(t, query)));
  const color =
    scope.kind === "list" ? lists.find((l) => l.id === scope.listId)?.color : smartLists.find((s) => s.scope.kind === scope.kind)?.color;

  const clearCompleted = () => withAnimation("snappy", () => deleteTodos(completed.map((t) => t.id)));

  return (
    <Screen title={scopeName(scope, lists)} searchText={search} onSearchTextChange={setSearch} searchPrompt="Search todos">
      <ToolbarItem placement="primaryAction">
        <Button title="Clear" disabled={!completed.length} onPress={() => setConfirmingClear(true)} accessibilityLabel="Clear completed">
          <ConfirmationDialog
            isPresented={confirmingClear}
            onDismiss={() => setConfirmingClear(false)}
            title={`Delete ${completed.length} completed ${completed.length === 1 ? "todo" : "todos"}?`}
          >
            <Button title="Clear Completed" role="destructive" onPress={clearCompleted} />
            <Button title="Cancel" role="cancel" onPress={() => {}} />
          </ConfirmationDialog>
        </Button>
      </ToolbarItem>

      <List>
        <Section>
          <Picker label="Filter" pickerStyle="segmented" value={filter} options={filters} onChange={(f) => setFilter(f as Filter)} />
        </Section>
        <Section footer={scoped.length ? `${scoped.length - completed.length} remaining · ${completed.length} completed` : undefined}>
          <NewTodoField scope={scope} today={today} color={color ?? "accent"} />
          {visible.map((todo) => (
            <TodoRow key={todo.id} todo={todo} today={today} showList={scope.kind !== "list"} />
          ))}
        </Section>
        {visible.length ? null : (
          <Section>
            {query ? (
              <EmptyState icon="magnifyingglass" title="No Results" message={`Nothing matches “${search.trim()}”.`} />
            ) : !scoped.length ? (
              <EmptyState icon="checklist" title="No Todos" message="Add one above to get started." />
            ) : filter === "active" ? (
              <EmptyState icon="checkmark.circle" title="All Done" message="Nothing left to do here. Nice work." />
            ) : (
              <EmptyState icon="circle.dashed" title="Nothing Completed" message="Todos you finish show up here." />
            )}
          </Section>
        )}
      </List>
    </Screen>
  );
}

function NewTodoField({ scope, today, color }: { scope: Scope; today: number; color: Color }) {
  const [title, setTitle] = useState("");
  const input = useRef<HostInstance>(null);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    withAnimation("snappy", () => {
      addTodo(trimmed, scope, today);
      setTitle("");
    });
    // Submitting ends editing; keep the keyboard up for the next one.
    input.current?.focus();
  };

  return (
    <HStack spacing={12}>
      <Image systemName="plus.circle.fill" font="title2" foregroundStyle={color} accessibilityHidden />
      <TextField
        ref={input}
        value={title}
        onChange={setTitle}
        onSubmit={submit}
        placeholder="New Todo"
        accessibilityLabel="New todo"
        accessibilityIdentifier="new-todo"
      />
    </HStack>
  );
}

export function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <VStack spacing={8} padding={{ vertical: 24 }} frame={{ maxWidth: "infinity" }} transition="opacity" accessibilityElement="combine">
      <Image systemName={icon} font="largeTitle" foregroundStyle="secondary" />
      <Text font="headline">{title}</Text>
      <Text font="subheadline" foregroundStyle="secondary" textAlignment="center">{message}</Text>
    </VStack>
  );
}
