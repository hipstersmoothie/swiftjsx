// Kanban: boards of columns of cards, like Trello or Linear. Drag cards
// between columns (worklets + measure()), edit them in a sheet, filter by
// label or assignee, search, archive. Persisted with zustand + localStorage.
import { useState } from "react";
import {
  Navigator, useNavigation, Screen, ToolbarItem, List, Section, Button, HStack, VStack, Text, Image, Label, Spacer, Sheet, Alert,
  SwipeActions, ContextMenu, ContentUnavailable, withAnimation, format,
} from "swiftjsx";
import { activeColumns, boardColors, cardCount, columnCards, type Board } from "./model";
import { deleteBoard, useKanban } from "./store";
import { BoardIcon } from "./ui";
import { BoardScreen } from "./BoardScreen";
import { BoardForm } from "./forms";

export function KanbanApp() {
  return (
    <Navigator>
      <BoardsScreen />
    </Navigator>
  );
}

function BoardsScreen() {
  const nav = useNavigation();
  const boards = useKanban((s) => s.boards);
  const [creating, setCreating] = useState(false);
  /** Edit (a board) or delete (confirm first). */
  const [editing, setEditing] = useState<Board | null>(null);
  const [deleting, setDeleting] = useState<Board | null>(null);
  const open = (board: Board) => nav.push(<BoardScreen boardId={board.id} />);

  return (
    <Screen title="Boards">
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => setCreating(true)} accessibilityLabel="New board" accessibilityIdentifier="new-board">
          <Image systemName="plus" />
        </Button>
      </ToolbarItem>

      {boards.length ? (
        <List>
          <Section footer="Long-press a board for more options.">
            {boards.map((board) => (
              <BoardRow key={board.id} board={board} onOpen={() => open(board)} onEdit={() => setEditing(board)} onDelete={() => setDeleting(board)} />
            ))}
          </Section>
        </List>
      ) : (
        <ContentUnavailable systemImage="rectangle.split.3x1" title="No boards" description="A board holds columns of cards for one project.">
          <Button title="New Board" buttonStyle="borderedProminent" onPress={() => setCreating(true)} />
        </ContentUnavailable>
      )}

      <Sheet isPresented={creating} onDismiss={() => setCreating(false)}>
        <Navigator>
          <BoardForm
            onDone={(id) => {
              setCreating(false);
              if (id) nav.push(<BoardScreen boardId={id} />);
            }}
          />
        </Navigator>
      </Sheet>

      <Sheet item={editing} onDismiss={() => setEditing(null)}>
        {(board) => (
          <Navigator>
            <BoardForm board={board} onDone={() => setEditing(null)} />
          </Navigator>
        )}
      </Sheet>

      <Alert
        item={deleting}
        onDismiss={() => setDeleting(null)}
        title={(board) => `Delete "${board.name}"?`}
        message={(board) => `Its ${format.count(Object.keys(board.cards).length, { one: "# card", other: "# cards" })} will be deleted too.`}
      >
        {(board) => (
          <>
            <Button title="Delete" role="destructive" onPress={() => withAnimation("default", () => deleteBoard(board.id))} />
            <Button title="Cancel" role="cancel" onPress={() => {}} />
          </>
        )}
      </Alert>
    </Screen>
  );
}

function BoardRow({ board, onOpen, onEdit, onDelete }: { board: Board; onOpen(): void; onEdit(): void; onDelete(): void }) {
  const columns = activeColumns(board);
  const cards = cardCount(board);
  const lastColumn = columns[columns.length - 1];
  const done = lastColumn ? columnCards(board, lastColumn).length : 0;

  return (
    <Button onPress={onOpen} accessibilityIdentifier="board-row" accessibilityHint="Opens the board">
      <HStack spacing={14} padding={{ vertical: 6 }}>
        <BoardIcon color={board.color} symbol={board.symbol} size={46} />
        <VStack alignment="leading" spacing={5}>
          <Text font="headline" foregroundStyle="primary" lineLimit={1}>{board.name || "Untitled Board"}</Text>
          <Text font="subheadline" foregroundStyle="secondary">
            {format.count(cards, { one: "# card", other: "# cards" })} · {format.count(columns.length, { one: "# column", other: "# columns" })}
          </Text>
          <Distribution board={board} />
        </VStack>
        <Spacer />
        {cards ? (
          <Text font="caption" fontWeight="semibold" monospacedDigit foregroundStyle={boardColors[board.color].tint}>
            {Math.round((done / cards) * 100)}%
          </Text>
        ) : null}
      </HStack>

      <SwipeActions edge="trailing">
        <Button tint="red" onPress={onDelete}>
          <Label title="Delete" systemImage="trash" />
        </Button>
        <Button tint="gray" onPress={onEdit}>
          <Label title="Edit" systemImage="pencil" />
        </Button>
      </SwipeActions>
      <ContextMenu>
        <Button onPress={onOpen}>
          <Label title="Open Board" systemImage="rectangle.split.3x1" />
        </Button>
        <Button onPress={onEdit}>
          <Label title="Edit Board" systemImage="pencil" />
        </Button>
        <Button role="destructive" onPress={onDelete}>
          <Label title="Delete Board" systemImage="trash" />
        </Button>
      </ContextMenu>
    </Button>
  );
}

/** How the board's cards spread over its columns: one bar segment per column, sized by its cards. */
function Distribution({ board }: { board: Board }) {
  const columns = activeColumns(board);
  const counts = columns.map((c) => columnCards(board, c).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const width = 150;
  if (!total) return null;
  return (
    <HStack spacing={2} accessibilityLabel={columns.map((c, i) => `${c.name}: ${counts[i]}`).join(", ")}>
      {columns.map((column, i) =>
        counts[i] ? (
          <VStack key={column.id} frame={{ width: Math.max(4, (counts[i] / total) * width), height: 5 }} background={column.color} cornerRadius={2.5} />
        ) : null,
      )}
    </HStack>
  );
}
