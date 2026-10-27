// One board: columns side by side in a horizontal ScrollView, each one a
// vertical list of cards. Drag a card by its grip (or long-press it first)
// to reorder it or move it to another column; the board auto-scrolls near
// its edges. Tap a card to edit it.
import { useRef, useState } from "react";
import {
  useNavigation, Screen, ToolbarItem, VStack, HStack, ZStack, ScrollView, Text, Image, Button, TextField, Spacer, Picker, Sheet,
  Menu, Section, Divider, Label, Navigator, withAnimation, useAnimatedStyle, haptic, type HostInstance, type Color,
} from "swiftjsx";
import {
  activeColumns, columnCards, filterCount, matches, memberById, members, noFilters, plural, UNASSIGNED,
  type Board, type Card, type Column, type Filters,
} from "./model";
import { addCard, moveCard, setColumnArchived, shiftColumn, useBoard } from "./store";
import { useCardDrag, type CardDrag, type Lane } from "./drag";
import { BoardCard, CardFace, Placeholder } from "./CardView";
import { CardDetail } from "./CardDetail";
import { ColumnForm, BoardForm } from "./forms";
import { ArchiveScreen } from "./ArchiveScreen";
import { Dot, EmptyState } from "./ui";
import { useToday } from "./today";

const COLUMN_WIDTH = 284;

export function BoardScreen({ boardId }: { boardId: string }) {
  const nav = useNavigation();
  const board = useBoard(boardId);
  const today = useToday();
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [armed, setArmed] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  /** The column being edited; `{ columnId: null }` adds one. */
  const [columnEditor, setColumnEditor] = useState<{ columnId: string | null } | null>(null);
  const [editingBoard, setEditingBoard] = useState(false);
  const boardScroll = useRef<HostInstance>(null);

  const columns = board ? activeColumns(board) : [];
  const visible = (column: Column) => (board ? columnCards(board, column).filter((c) => matches(c, filters)) : []);
  const lanes: Lane[] = columns.map((column) => ({ id: column.id, cardIds: visible(column).map((c) => c.id) }));
  const drag = useCardDrag({
    lanes,
    onDrop: (cardId, columnId, beforeId) => {
      setArmed(null);
      moveCard(boardId, cardId, columnId, beforeId);
    },
  });

  if (!board) return <Screen title="Board" />;

  const total = columns.reduce((n, c) => n + columnCards(board, c).length, 0);
  const shown = lanes.reduce((n, l) => n + l.cardIds.length, 0);
  const filtering = filterCount(filters) > 0 || filters.query.trim() !== "";
  const dragged = drag.active ? board.cards[drag.active.cardId] : undefined;

  const arm = (id: string) => {
    haptic("rigid");
    withAnimation("snappy", () => setArmed(id));
  };
  const disarm = () => withAnimation("snappy", () => setArmed(null));

  return (
    <Screen
      title={board.name}
      titleDisplayMode="inline"
      searchText={filters.query}
      onSearchTextChange={(query) => setFilters((f) => ({ ...f, query }))}
      searchPrompt="Search cards"
    >
      <ToolbarItem placement="primaryAction">
        <FilterMenu board={board} filters={filters} onChange={setFilters} />
      </ToolbarItem>
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="ellipsis.circle" accessibilityLabel="Board options" accessibilityIdentifier="board-menu">
          <Button onPress={() => setColumnEditor({ columnId: null })}>
            <Label title="Add Column" systemImage="rectangle.badge.plus" />
          </Button>
          <Button onPress={() => nav.push(<ArchiveScreen boardId={boardId} />)}>
            <Label title="Archived Items" systemImage="archivebox" />
          </Button>
          <Divider />
          <Button onPress={() => setEditingBoard(true)}>
            <Label title="Edit Board" systemImage="pencil" />
          </Button>
        </Menu>
      </ToolbarItem>

      <ZStack ref={drag.ref("container")} alignment="topLeading" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background="systemBackground">
        <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
          {filtering ? <FilterSummary board={board} filters={filters} onChange={setFilters} shown={shown} total={total} /> : null}

          {columns.length ? (
            <ScrollView
              ref={(node: HostInstance | null) => {
                boardScroll.current = node;
                drag.ref("board")(node);
              }}
              axis="horizontal"
              showsIndicators={false}
              contentMargins={{ horizontal: 16, top: 12, bottom: 16 }}
              onScroll={drag.scrolled("board")}
              frame={{ maxHeight: "infinity" }}
            >
              <HStack alignment="top" spacing={12} frame={{ maxHeight: "infinity", alignment: "top" }}>
                {columns.map((column, i) => (
                  <ColumnView
                    key={column.id}
                    board={board}
                    column={column}
                    cards={visible(column)}
                    today={today}
                    drag={drag}
                    armed={armed}
                    first={i === 0}
                    last={i === columns.length - 1}
                    filtering={filtering}
                    onOpen={(card) => setDetail(card.id)}
                    onArm={arm}
                    onDisarm={disarm}
                    onEdit={() => setColumnEditor({ columnId: column.id })}
                  />
                ))}
                <AddColumnTile onPress={() => setColumnEditor({ columnId: null })} />
              </HStack>
            </ScrollView>
          ) : (
            <EmptyState symbol="rectangle.split.3x1" title="No columns" message="Add a column for each stage your cards go through.">
              <Button title="Add Column" buttonStyle="borderedProminent" onPress={() => setColumnEditor({ columnId: null })} />
            </EmptyState>
          )}
        </VStack>

        {drag.active && dragged ? <Ghost drag={drag} card={dragged} board={board} today={today} /> : null}
      </ZStack>

      <Sheet item={detail} onDismiss={() => setDetail(null)} detents={["large"]}>
        {(cardId) => (
          <Navigator>
            <CardDetail boardId={boardId} cardId={cardId} onClose={() => setDetail(null)} />
          </Navigator>
        )}
      </Sheet>

      <Sheet item={columnEditor} onDismiss={() => setColumnEditor(null)} detents={["medium"]}>
        {({ columnId }) => (
          <Navigator>
            <ColumnForm
              boardId={boardId}
              columnId={columnId}
              onDone={(added) => {
                setColumnEditor(null);
                // A new column goes at the end: show it.
                if (added) setTimeout(() => boardScroll.current?.scrollTo("end"), 350);
              }}
            />
          </Navigator>
        )}
      </Sheet>

      <Sheet isPresented={editingBoard} onDismiss={() => setEditingBoard(false)}>
        <Navigator>
          <BoardForm board={board} onDone={() => setEditingBoard(false)} />
        </Navigator>
      </Sheet>
    </Screen>
  );
}

// MARK: Filters

const toggled = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

function FilterMenu({ board, filters, onChange }: { board: Board; filters: Filters; onChange(f: Filters): void }) {
  const count = filterCount(filters);
  return (
    <Menu
      systemImage={count ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle"}
      accessibilityLabel={count ? `Filters, ${count} on` : "Filters"}
      accessibilityIdentifier="filters"
    >
      <Section header="Labels">
        {board.labels.map((label) => (
          // A Button whose label has a checkmark: Menu has no multi-select toggles.
          <Button key={label.id} onPress={() => onChange({ ...filters, labelIds: toggled(filters.labelIds, label.id) })}>
            <Label title={label.name} systemImage={filters.labelIds.includes(label.id) ? "checkmark" : "circle.fill"} />
          </Button>
        ))}
      </Section>
      <Picker
        label="Assignee"
        value={filters.assigneeId ?? ""}
        onChange={(value) => onChange({ ...filters, assigneeId: value || null })}
        options={[
          { value: "", label: "Anyone" },
          { value: UNASSIGNED, label: "Unassigned" },
          ...members.map((m) => ({ value: m.id, label: m.name })),
        ]}
      />
      {count ? (
        <>
          <Divider />
          <Button role="destructive" onPress={() => onChange({ ...noFilters, query: filters.query })}>
            <Label title="Clear Filters" systemImage="xmark.circle" />
          </Button>
        </>
      ) : null}
    </Menu>
  );
}

/** The active filters as removable chips, under the navigation bar. */
function FilterSummary({ board, filters, onChange, shown, total }: { board: Board; filters: Filters; onChange(f: Filters): void; shown: number; total: number }) {
  const assignee = filters.assigneeId === UNASSIGNED ? "Unassigned" : memberById(filters.assigneeId)?.name;
  return (
    <VStack spacing={6} padding={{ top: 8, bottom: 6 }} background="secondarySystemBackground/60" transition="opacity">
      <ScrollView axis="horizontal" showsIndicators={false} contentMargins={{ horizontal: 16 }}>
        <HStack spacing={6}>
          {assignee ? <Chip text={assignee} systemImage="person.fill" color="accent" onRemove={() => onChange({ ...filters, assigneeId: null })} /> : null}
          {filters.labelIds.map((id) => {
            const label = board.labels.find((l) => l.id === id);
            return label ? <Chip key={id} text={label.name} color={label.color} onRemove={() => onChange({ ...filters, labelIds: toggled(filters.labelIds, id) })} /> : null;
          })}
          {filters.query.trim() ? <Chip text={`“${filters.query.trim()}”`} systemImage="magnifyingglass" color="gray" onRemove={() => onChange({ ...filters, query: "" })} /> : null}
        </HStack>
      </ScrollView>
      <HStack padding={{ horizontal: 16 }}>
        <Text font="caption" foregroundStyle="secondary" monospacedDigit>
          {shown} of {plural(total, "card")}
        </Text>
        <Spacer />
        <Button title="Clear All" font="caption" fontWeight="semibold" buttonStyle="borderless" onPress={() => onChange(noFilters)} accessibilityIdentifier="clear-filters" />
      </HStack>
    </VStack>
  );
}

function Chip({ text, systemImage, color, onRemove }: { text: string; systemImage?: string; color: Color; onRemove(): void }) {
  return (
    <HStack
      spacing={5}
      padding={{ leading: 10, trailing: 8, vertical: 5 }}
      background={color}
      foregroundStyle="white"
      cornerRadius="capsule"
      onTapGesture={onRemove}
      accessibilityElement="combine"
      accessibilityLabel={`Filter: ${text}`}
      accessibilityHint="Removes this filter"
      accessibilityTraits="button"
    >
      {systemImage ? <Image systemName={systemImage} font="caption2" /> : null}
      <Text font="footnote" fontWeight="semibold">{text}</Text>
      <Image systemName="xmark" font="caption2" fontWeight="bold" />
    </HStack>
  );
}

// MARK: Columns

type ColumnProps = {
  board: Board;
  column: Column;
  cards: Card[];
  today: number;
  drag: CardDrag;
  armed: string | null;
  first: boolean;
  last: boolean;
  filtering: boolean;
  onOpen(card: Card): void;
  onArm(cardId: string): void;
  onDisarm(): void;
  onEdit(): void;
};

function ColumnView({ board, column, cards, today, drag, armed, first, last, filtering, onOpen, onArm, onDisarm, onEdit }: ColumnProps) {
  const [composing, setComposing] = useState(false);
  const list = useRef<HostInstance>(null);
  const all = columnCards(board, column).length;
  const a = drag.active;
  const target = a && a.target.columnId === column.id ? a.target : null;
  const incoming = !!target && a?.fromColumnId !== column.id;
  // The dragged card counts where it would land.
  const count = cards.length + (incoming ? 1 : 0) - (a && a.fromColumnId === column.id && !target ? 1 : 0);

  const placeholder = () => <Placeholder key="placeholder" height={a?.frame.height ?? 0} refFn={drag.ref("placeholder")} />;
  const rows = cards.flatMap((card) => {
    const row = (
      <BoardCard
        key={card.id}
        card={card}
        labels={board.labels}
        today={today}
        drag={drag}
        armed={armed === card.id}
        collapsed={a?.cardId === card.id}
        onOpen={() => onOpen(card)}
        onArm={() => onArm(card.id)}
        onDisarm={onDisarm}
      />
    );
    return target && target.beforeId === card.id ? [placeholder(), row] : [row];
  });
  if (target && target.beforeId === null) rows.push(placeholder());

  return (
    <VStack
      ref={drag.ref(`col:${column.id}`)}
      spacing={0}
      frame={{ width: COLUMN_WIDTH, maxHeight: "infinity", alignment: "top" }}
      background={incoming ? "accent/8" : "secondarySystemBackground"}
      cornerRadius={16}
      border={{ color: incoming ? "accent/40" : "clear", width: 1.5 }}
      accessibilityElement="contain"
      accessibilityLabel={`${column.name}, ${plural(cards.length, "card")}`}
      accessibilityIdentifier={`column-${column.name}`}
    >
      <HStack spacing={8} padding={{ leading: 14, trailing: 4, top: 10, bottom: 8 }}>
        <Dot color={column.color} size={10} />
        <Text font="subheadline" fontWeight="bold" lineLimit={1}>{column.name}</Text>
        <Text
          font="caption"
          fontWeight="semibold"
          monospacedDigit
          foregroundStyle="secondary"
          padding={{ horizontal: 7, vertical: 2 }}
          background="tertiarySystemFill"
          cornerRadius="capsule"
          animation="snappy"
        >
          {filtering && cards.length !== all ? `${count}/${all}` : count}
        </Text>
        <Spacer />
        <Menu systemImage="ellipsis" tint="secondary" frame={{ width: 36, height: 30 }} accessibilityLabel={`${column.name} options`} accessibilityIdentifier="column-menu">
          <Button onPress={() => setComposing(true)}>
            <Label title="Add Card" systemImage="plus" />
          </Button>
          <Button onPress={onEdit}>
            <Label title="Edit Column" systemImage="pencil" />
          </Button>
          <Divider />
          {!first ? (
            <Button onPress={() => withAnimation("snappy", () => shiftColumn(board.id, column.id, -1))}>
              <Label title="Move Left" systemImage="arrow.left" />
            </Button>
          ) : null}
          {!last ? (
            <Button onPress={() => withAnimation("snappy", () => shiftColumn(board.id, column.id, 1))}>
              <Label title="Move Right" systemImage="arrow.right" />
            </Button>
          ) : null}
          <Divider />
          <Button role="destructive" onPress={() => withAnimation("snappy", () => setColumnArchived(board.id, column.id, true))}>
            <Label title="Archive Column" systemImage="archivebox" />
          </Button>
        </Menu>
      </HStack>

      <ScrollView
        ref={(node: HostInstance | null) => {
          list.current = node;
          drag.ref(`list:${column.id}`)(node);
        }}
        spacing={0}
        contentMargins={{ horizontal: 10, top: 2 }}
        onScroll={drag.scrolled(`list:${column.id}`)}
        frame={{ maxHeight: "infinity" }}
      >
        {rows}
        {!cards.length && !target ? (
          <Text font="footnote" foregroundStyle="tertiaryLabel" padding={{ vertical: 18 }} frame={{ maxWidth: "infinity" }}>
            {filtering && all ? "No matching cards" : "No cards yet"}
          </Text>
        ) : null}
        {composing ? (
          <Composer
            onAdd={(title) => {
              addCard(board.id, column.id, title);
              setTimeout(() => list.current?.scrollTo("end"), 50);
            }}
            onClose={() => setComposing(false)}
          />
        ) : null}
      </ScrollView>

      {composing ? null : (
        <Button buttonStyle="plain" onPress={() => setComposing(true)} accessibilityLabel={`Add a card to ${column.name}`} accessibilityIdentifier="add-card">
          <HStack spacing={6} padding={{ horizontal: 14, vertical: 12 }} frame={{ maxWidth: "infinity", alignment: "leading" }} contentShape="rectangle" foregroundStyle="secondary">
            <Image systemName="plus" font="footnote" fontWeight="semibold" />
            <Text font="subheadline" fontWeight="medium">Add card</Text>
          </HStack>
        </Button>
      )}
    </VStack>
  );
}

/** Inline "new card" field at the bottom of a column. Stays open (and focused) to add several. */
function Composer({ onAdd, onClose }: { onAdd(title: string): void; onClose(): void }) {
  const [title, setTitle] = useState("");
  const add = () => {
    const t = title.trim();
    if (!t) return onClose();
    onAdd(t);
    setTitle("");
  };
  return (
    <VStack spacing={8} padding={{ bottom: 8 }} transition="opacity">
      <TextField
        value={title}
        onChange={setTitle}
        placeholder="Card title"
        onSubmit={add}
        autoFocus
        blurOnSubmit={false}
        submitLabel="done"
        accessibilityIdentifier="new-card-title"
      />
      <HStack spacing={8}>
        <Button title="Add Card" buttonStyle="borderedProminent" font="footnote" onPress={add} disabled={!title.trim()} accessibilityIdentifier="confirm-add-card" />
        <Button title="Done" buttonStyle="borderless" font="footnote" onPress={onClose} />
      </HStack>
    </VStack>
  );
}

function AddColumnTile({ onPress }: { onPress(): void }) {
  return (
    <Button buttonStyle="plain" onPress={onPress} accessibilityLabel="Add column" accessibilityIdentifier="add-column">
      <VStack spacing={6} padding={16} frame={{ width: 200, height: 96 }} foregroundStyle="secondary" border={{ color: "separator", width: 1 }} cornerRadius={16}>
        <Image systemName="plus.rectangle.on.rectangle" font="title3" />
        <Text font="subheadline" fontWeight="medium">Add column</Text>
      </VStack>
    </Button>
  );
}

// MARK: The dragged card

/**
 * A copy of the dragged card drawn over the whole board, following the finger
 * on the main thread. Three nodes, because one animated style update takes a
 * single animation: the base position (plain props), the finger's
 * translation (unanimated), and the lift (sprung).
 */
function Ghost({ drag, card, board, today }: { drag: CardDrag; card: Card; board: Board; today: number }) {
  const a = drag.active!;
  const position = drag.position;
  const lift = drag.lift;
  const follow = useAnimatedStyle(() => ({ offset: { x: position.get().x, y: position.get().y } }));
  const lifted = useAnimatedStyle(() => ({
    scale: 1 + lift.get() * 0.04,
    rotation: lift.get() * 2.5,
    shadow: { radius: 2 + lift.get() * 18, y: 1 + lift.get() * 12, color: "#00000040" },
  }));
  return (
    <VStack
      offset={{ x: a.frame.x - a.origin.x, y: a.frame.y - a.origin.y }}
      frame={{ width: a.frame.width }}
      // If the drag gesture was cancelled (no onDragEnd), a tap puts the card back.
      onTapGesture={drag.cancel}
      accessibilityHidden
    >
      <VStack animatedStyle={follow}>
        <VStack animatedStyle={lifted}>
          <CardFace card={card} labels={board.labels} today={today} lifted />
        </VStack>
      </VStack>
    </VStack>
  );
}
