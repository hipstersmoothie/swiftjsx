import {
  useNavigation, withAnimation, HStack, VStack, Text, Image, Label, Button, Spacer, Divider, SwipeActions, ContextMenu,
} from "swiftjsx";
import { useTodos, updateTodo, deleteTodos, type Todo } from "./store";
import { dueLabel, duePresets } from "./dates";
import { TodoDetail } from "./TodoDetail";

/** A todo in a `<List>`: tap the circle to complete, the rest for details. */
export function TodoRow({ todo, today, showList }: { todo: Todo; today: number; showList?: boolean }) {
  const nav = useNavigation();
  const lists = useTodos((s) => s.lists);
  const list = lists.find((l) => l.id === todo.listId);
  const due = todo.due === null ? null : dueLabel(todo.due, today);
  const overdue = !!due?.overdue && !todo.done;

  const update = (changes: Partial<Todo>) => withAnimation("snappy", () => updateTodo(todo.id, changes));
  const remove = () => withAnimation("snappy", () => deleteTodos([todo.id]));

  return (
    <HStack
      spacing={12}
      onTapGesture={() => nav.push(<TodoDetail id={todo.id} />)}
      accessibilityElement="contain"
      accessibilityIdentifier="todo-row"
    >
      <Image
        systemName={todo.done ? "checkmark.circle.fill" : "circle"}
        font="title2"
        foregroundStyle={todo.done ? (list?.color ?? "accent") : "secondary"}
        onTapGesture={() => update({ done: !todo.done })}
        accessibilityLabel={todo.done ? "Mark as not done" : "Mark as done"}
        accessibilityTraits="button"
      />
      <VStack alignment="leading" spacing={2} accessibilityElement="combine" accessibilityHint="Shows details">
        <Text strikethrough={todo.done} foregroundStyle={todo.done ? "secondary" : "primary"} lineLimit={2}>
          {todo.title}
        </Text>
        {showList || due || todo.notes ? (
          <HStack spacing={8}>
            {showList && list ? <Text font="caption" foregroundStyle={list.color}>{list.name}</Text> : null}
            {due ? (
              <Label
                title={overdue ? `Overdue · ${due.text}` : due.text}
                systemImage="calendar"
                font="caption"
                foregroundStyle={overdue ? "red" : "secondary"}
              />
            ) : null}
            {todo.notes ? <Image systemName="note.text" font="caption" foregroundStyle="secondary" accessibilityLabel="Has notes" /> : null}
          </HStack>
        ) : null}
      </VStack>
      <Spacer />
      {todo.flagged ? <Image systemName="flag.fill" font="footnote" foregroundStyle="orange" accessibilityLabel="Flagged" /> : null}

      <SwipeActions edge="leading" allowsFullSwipe>
        <Button tint="orange" onPress={() => update({ flagged: !todo.flagged })}>
          <Label title={todo.flagged ? "Unflag" : "Flag"} systemImage={todo.flagged ? "flag.slash.fill" : "flag.fill"} />
        </Button>
      </SwipeActions>
      <SwipeActions edge="trailing" allowsFullSwipe>
        <Button role="destructive" onPress={remove}>
          <Label title="Delete" systemImage="trash" />
        </Button>
      </SwipeActions>

      {/* No submenus in SwiftJSX yet, so due dates and lists are flat sections. */}
      <ContextMenu>
        <Button onPress={() => update({ done: !todo.done })}>
          <Label title={todo.done ? "Mark as Not Done" : "Mark as Done"} systemImage={todo.done ? "circle" : "checkmark.circle"} />
        </Button>
        <Button onPress={() => update({ flagged: !todo.flagged })}>
          <Label title={todo.flagged ? "Unflag" : "Flag"} systemImage={todo.flagged ? "flag.slash" : "flag"} />
        </Button>
        <Divider />
        {duePresets(today)
          .filter((p) => p.due !== todo.due)
          .map((p) => (
            <Button key={p.label} onPress={() => update({ due: p.due })}>
              <Label title={`Due ${p.label}`} systemImage={p.icon} />
            </Button>
          ))}
        {todo.due !== null ? (
          <Button onPress={() => update({ due: null })}>
            <Label title="Remove Due Date" systemImage="calendar.badge.minus" />
          </Button>
        ) : null}
        <Divider />
        {lists
          .filter((l) => l.id !== todo.listId)
          .map((l) => (
            <Button key={l.id} onPress={() => update({ listId: l.id })}>
              <Label title={`Move to ${l.name}`} systemImage={l.icon} />
            </Button>
          ))}
        <Divider />
        <Button role="destructive" onPress={remove}>
          <Label title="Delete" systemImage="trash" />
        </Button>
      </ContextMenu>
    </HStack>
  );
}
