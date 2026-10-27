// Archived cards and columns of a board: restore or delete them.
import { List, Section, Screen, HStack, VStack, Text, Button, Label, SwipeActions, withAnimation } from "swiftjsx";
import { archivedCards, plural } from "./model";
import { deleteCard, deleteColumn, setCardArchived, setColumnArchived, useBoard } from "./store";
import { Dot, EmptyState } from "./ui";

export function ArchiveScreen({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);
  if (!board) return <Screen title="Archive" />;
  const cards = archivedCards(board).sort((a, b) => b.createdAt - a.createdAt);
  const columns = board.columns.filter((c) => c.archived);
  const columnName = (id: string) => board.columns.find((c) => c.id === id)?.name ?? "Deleted column";

  return (
    <Screen title="Archive" titleDisplayMode="inline">
      {cards.length || columns.length ? (
        <List>
          {columns.length ? (
            <Section header="Columns" footer="Restoring a column brings back its cards too.">
              {columns.map((column) => (
                <HStack key={column.id} spacing={10} accessibilityIdentifier="archived-column">
                  <Dot color={column.color} size={10} />
                  <VStack alignment="leading" spacing={2}>
                    <Text font="body">{column.name}</Text>
                    <Text font="caption" foregroundStyle="secondary">{plural(column.cardIds.length, "card")}</Text>
                  </VStack>
                  <SwipeActions edge="leading">
                    <Button tint="green" onPress={() => withAnimation("default", () => setColumnArchived(boardId, column.id, false))}>
                      <Label title="Restore" systemImage="tray.and.arrow.up" />
                    </Button>
                  </SwipeActions>
                  <SwipeActions edge="trailing">
                    <Button role="destructive" onPress={() => deleteColumn(boardId, column.id)}>
                      <Label title="Delete" systemImage="trash" />
                    </Button>
                  </SwipeActions>
                </HStack>
              ))}
            </Section>
          ) : null}
          {cards.length ? (
            <Section header="Cards" footer="Swipe right to restore, left to delete.">
              {cards.map((card) => (
                <VStack key={card.id} alignment="leading" spacing={2} accessibilityIdentifier="archived-card">
                  <Text font="body" lineLimit={2}>{card.title || "Untitled"}</Text>
                  <Text font="caption" foregroundStyle="secondary">From {columnName(card.columnId)}</Text>
                  <SwipeActions edge="leading">
                    <Button tint="green" onPress={() => withAnimation("default", () => setCardArchived(boardId, card.id, false))}>
                      <Label title="Restore" systemImage="tray.and.arrow.up" />
                    </Button>
                  </SwipeActions>
                  <SwipeActions edge="trailing">
                    <Button role="destructive" onPress={() => deleteCard(boardId, card.id)}>
                      <Label title="Delete" systemImage="trash" />
                    </Button>
                  </SwipeActions>
                </VStack>
              ))}
            </Section>
          ) : null}
        </List>
      ) : (
        <EmptyState symbol="archivebox" title="Nothing archived" message="Archived cards and columns show up here, ready to restore." />
      )}
    </Screen>
  );
}
