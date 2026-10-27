// A todo app: lists and smart lists, filters, search, swipe actions, context
// menus, due dates, and everything persisted with zustand + localStorage.
import { useState } from "react";
import {
  Navigator, useNavigation, withAnimation, Screen, ToolbarItem, List, Section, HStack, Text, Image, Label, Button, Spacer,
  SwipeActions, Alert, type Color,
} from "swiftjsx";
import { useTodos, deleteList, inScope, matchesSearch, smartLists, sortTodos, INBOX, type Scope, type TodoList } from "./store";
import { useToday } from "./dates";
import { TodosScreen, EmptyState } from "./TodosScreen";
import { TodoRow } from "./TodoRow";
import { NewListSheet } from "./NewListSheet";

export function TodosApp() {
  return (
    <Navigator>
      <HomeScreen />
    </Navigator>
  );
}

function HomeScreen() {
  const nav = useNavigation();
  const today = useToday();
  const lists = useTodos((s) => s.lists);
  const todos = useTodos((s) => s.todos);
  const [search, setSearch] = useState("");
  const [newList, setNewList] = useState({ open: false, key: 0 });
  // The alert keeps showing the list's name while it animates away, so the
  // list and the "presented" flag are separate state.
  const [deleting, setDeleting] = useState<TodoList | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const remaining = (scope: Scope) => todos.filter((t) => !t.done && inScope(t, scope, today)).length;
  const open = (scope: Scope) => nav.push(<TodosScreen scope={scope} />);
  const deletingCount = todos.filter((t) => t.listId === deleting?.id).length;

  return (
    <Screen title="Todos" searchText={search} onSearchTextChange={setSearch} searchPrompt="Search all todos">
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => setNewList((n) => ({ open: true, key: n.key + 1 }))} accessibilityLabel="Add list">
          <Image systemName="folder.badge.plus" />
        </Button>
      </ToolbarItem>

      {search.trim() ? (
        <SearchResults query={search.trim()} today={today} />
      ) : (
        <List>
          <Section>
            {smartLists.map((smart) => (
              <ListRow
                key={smart.name}
                name={smart.name}
                icon={smart.icon}
                color={smart.color}
                count={remaining(smart.scope)}
                onPress={() => open(smart.scope)}
              />
            ))}
          </Section>
          <Section header="My Lists">
            {lists.map((list) => {
              const scope: Scope = { kind: "list", listId: list.id };
              return (
                <ListRow
                  key={list.id}
                  name={list.name}
                  icon={list.icon}
                  color={list.color}
                  count={remaining(scope)}
                  onPress={() => open(scope)}
                  onDelete={
                    list.id === INBOX
                      ? undefined
                      : () => {
                          setDeleting(list);
                          setConfirmingDelete(true);
                        }
                  }
                />
              );
            })}
          </Section>
        </List>
      )}

      <NewListSheet isPresented={newList.open} formKey={newList.key} onClose={() => setNewList((n) => ({ ...n, open: false }))} />
      <Alert
        isPresented={confirmingDelete}
        onDismiss={() => setConfirmingDelete(false)}
        title={`Delete “${deleting?.name}”?`}
        message={deletingCount ? `This also deletes its ${deletingCount} ${deletingCount === 1 ? "todo" : "todos"}.` : undefined}
      >
        <Button title="Delete" role="destructive" onPress={() => deleting && withAnimation("snappy", () => deleteList(deleting.id))} />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}

function ListRow({ name, icon, color, count, onPress, onDelete }: {
  name: string;
  icon: string;
  color: Color;
  count: number;
  onPress(): void;
  onDelete?: () => void;
}) {
  return (
    <Button onPress={onPress} accessibilityLabel={name} accessibilityValue={`${count} remaining`} accessibilityIdentifier="list-row">
      <HStack spacing={12}>
        <Image
          systemName={icon}
          font="subheadline"
          fontWeight="semibold"
          foregroundStyle="white"
          frame={{ width: 30, height: 30 }}
          background={color}
          cornerRadius={15}
        />
        <Text foregroundStyle="primary">{name}</Text>
        <Spacer />
        <Text foregroundStyle="secondary" monospacedDigit animation="snappy">{count}</Text>
        <Image systemName="chevron.right" font="footnote" fontWeight="semibold" foregroundStyle="tertiary" />
      </HStack>
      {/* Not role="destructive": that removes the row right away, before the alert confirms. */}
      {onDelete ? (
        <SwipeActions edge="trailing">
          <Button tint="red" onPress={onDelete}>
            <Label title="Delete" systemImage="trash" />
          </Button>
        </SwipeActions>
      ) : null}
    </Button>
  );
}

/** Todos in every list matching `query`, grouped by list. */
function SearchResults({ query, today }: { query: string; today: number }) {
  const lists = useTodos((s) => s.lists);
  const todos = useTodos((s) => s.todos);
  const q = query.toLowerCase();
  const groups = lists
    .map((list) => ({ list, todos: sortTodos(todos.filter((t) => t.listId === list.id && matchesSearch(t, q))) }))
    .filter((group) => group.todos.length);

  return (
    <List>
      {groups.length ? (
        groups.map(({ list, todos }) => (
          <Section key={list.id} header={list.name}>
            {todos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} today={today} />
            ))}
          </Section>
        ))
      ) : (
        <Section>
          <EmptyState icon="magnifyingglass" title="No Results" message={`Nothing matches “${query}”.`} />
        </Section>
      )}
    </List>
  );
}
