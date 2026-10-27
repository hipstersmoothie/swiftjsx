// A card on the board: what it looks like (CardFace), and the draggable
// wrapper the columns render (BoardCard). The ghost that follows the finger
// while dragging is in BoardScreen.
import { useEffect } from "react";
import { VStack, HStack, ZStack, Text, Image, Spacer, RoundedRectangle, runOnJS, type Color, type HostInstance } from "swiftjsx";
import { dueLabel, memberById, type Card, type CardLabel } from "./model";
import { Avatar, LabelCapsule } from "./ui";
import type { CardDrag } from "./drag";

/** Space below each card. It's padding inside the card's node (not stack spacing), so a collapsed card takes no room. */
export const CARD_GAP = 8;
const MAX_LABELS = 3;

export function CardFace({ card, labels, today, lifted = false }: { card: Card; labels: CardLabel[]; today: number; lifted?: boolean }) {
  const shown = card.labelIds.map((id) => labels.find((l) => l.id === id)).filter((l): l is CardLabel => !!l);
  const assignee = memberById(card.assigneeId);
  const done = card.checklist.filter((i) => i.done).length;
  const total = card.checklist.length;
  const due = card.due === null ? null : dueLabel(card.due, today);
  const dueColor: Color = due?.tone === "overdue" ? "red" : due?.tone === "soon" ? "orange" : "secondaryLabel";
  const hasFooter = due || total || assignee || card.description;

  return (
    <VStack
      alignment="leading"
      spacing={8}
      padding={12}
      frame={{ maxWidth: "infinity", alignment: "leading" }}
      background={{ light: "white", dark: "#2C2C2E" }}
      cornerRadius={12}
      border={{ color: lifted ? "accent/60" : "separator/40", width: lifted ? 2 : 0.5 }}
      shadow={{ radius: 1.5, y: 1, color: "#0000001A" }}
    >
      {shown.length ? (
        <HStack spacing={4}>
          {shown.slice(0, MAX_LABELS).map((label) => (
            <LabelCapsule key={label.id} label={label} compact />
          ))}
          {shown.length > MAX_LABELS ? (
            <Text font={{ size: 11, weight: "semibold" }} foregroundStyle="secondary">
              +{shown.length - MAX_LABELS}
            </Text>
          ) : null}
        </HStack>
      ) : null}

      <Text font="subheadline" fontWeight="semibold" foregroundStyle="primary" lineLimit={3}>
        {card.title || "Untitled"}
      </Text>

      {hasFooter ? (
        <HStack spacing={10}>
          {due ? (
            <HStack spacing={3} foregroundStyle={dueColor}>
              <Image systemName={due.tone === "overdue" ? "exclamationmark.circle.fill" : "calendar"} font="caption2" />
              <Text font="caption" fontWeight="medium">{due.text}</Text>
            </HStack>
          ) : null}
          {total ? (
            <HStack spacing={3} foregroundStyle={done === total ? "green" : "secondaryLabel"}>
              <Image systemName={done === total ? "checkmark.square.fill" : "checklist"} font="caption2" />
              <Text font="caption" fontWeight="medium" monospacedDigit>
                {done}/{total}
              </Text>
            </HStack>
          ) : null}
          {card.description ? <Image systemName="text.alignleft" font="caption2" foregroundStyle="tertiaryLabel" accessibilityHidden /> : null}
          <Spacer />
          {assignee ? <Avatar member={assignee} /> : null}
        </HStack>
      ) : null}

      {total ? <ChecklistBar done={done} total={total} /> : null}
    </VStack>
  );
}

/** Fixed-width point math: there's no proportional layout (GeometryReader). */
function ChecklistBar({ done, total }: { done: number; total: number }) {
  const segments = Math.min(total, 12);
  const filled = Math.round((done / total) * segments);
  return (
    <HStack spacing={2} accessibilityHidden>
      {Array.from({ length: segments }, (_, i) => (
        <VStack key={i} frame={{ maxWidth: "infinity", height: 3 }} cornerRadius={1.5} background={i < filled ? (done === total ? "green" : "accent") : "systemFill"} />
      ))}
    </HStack>
  );
}

type BoardCardProps = {
  card: Card;
  labels: CardLabel[];
  today: number;
  drag: CardDrag;
  /** Picked up by a long press: the whole card can be dragged now. */
  armed: boolean;
  /** Being dragged: the ghost shows it, this one collapses. */
  collapsed: boolean;
  onOpen(): void;
  onArm(): void;
  onDisarm(): void;
};

export function BoardCard({ card, labels, today, drag, armed, collapsed, onOpen, onArm, onDisarm }: BoardCardProps) {
  const { pickUp, move, drop } = drag;
  const id = card.id;

  // Disarm a picked-up card the user didn't drag.
  useEffect(() => {
    // Not mid-drag: removing onDrag would cancel the gesture, and a cancelled
    // drag never calls onDragEnd.
    if (!armed || collapsed) return;
    const timer = setTimeout(onDisarm, 5000);
    return () => clearTimeout(timer);
  }, [armed, collapsed, onDisarm]);

  const position = drag.position;
  const onDrag = (e: { translation: { x: number; y: number }; location: { x: number; y: number }; startLocation: { x: number; y: number } }) => {
    "worklet";
    // The first move of a drag: pick the card up. (Not a per-card flag: a
    // cancelled drag never calls onDragEnd to clear it. The board resets
    // `position` after every drop or cancel.)
    if (position.get().id !== id) runOnJS(pickUp)(id, e.startLocation.x, e.startLocation.y);
    position.set({ id, x: e.translation.x, y: e.translation.y });
    runOnJS(move)(e.location.x, e.location.y);
  };
  const onDragEnd = (e: { location: { x: number; y: number } }) => {
    "worklet";
    runOnJS(drop)(e.location.x, e.location.y);
  };

  const labelNames = card.labelIds.map((l) => labels.find((x) => x.id === l)?.name).filter(Boolean);
  const summary = [
    card.title,
    labelNames.length ? `Labels: ${labelNames.join(", ")}` : "",
    card.checklist.length ? `${card.checklist.filter((i) => i.done).length} of ${card.checklist.length} done` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    // No `animation` prop: picking up must not animate the collapse (the
    // ghost takes the card's place in the same frame). Arming animates
    // through withAnimation instead.
    <VStack
      ref={drag.ref(`card:${id}`)}
      padding={{ bottom: collapsed ? 0 : CARD_GAP }}
      frame={collapsed ? { height: 0 } : undefined}
      // Not 0: a view at opacity 0 stops hit testing, which could cancel
      // the drag that's in flight on it.
      opacity={collapsed ? 0.01 : 1}
      scale={armed ? 1.03 : 1}
      onTapGesture={armed ? onDisarm : onOpen}
      onLongPress={onArm}
      longPressDuration={0.35}
      // Only an armed card takes the drag (anywhere on it); otherwise the
      // drag is left to the scroll views, and the grip starts one. (There's no
      // long-press-then-drag gesture: arming re-renders with onDrag set, and
      // the drag is a new touch.)
      onDrag={armed ? onDrag : undefined}
      onDragEnd={armed ? onDragEnd : undefined}
      dragMinimumDistance={2}
      accessibilityElement="combine"
      accessibilityLabel={summary}
      accessibilityHint={armed ? "Picked up. Drag to move it, or tap to put it down." : "Opens the card. Long-press to pick it up, then drag to move it."}
      accessibilityTraits="button"
      accessibilityIdentifier="card"
    >
      <ZStack alignment="topTrailing">
        <CardFace card={card} labels={labels} today={today} lifted={armed} />
        {/* The grip: a drag starts here at once, without a long press. */}
        <Image
          systemName="line.3.horizontal"
          font="caption"
          fontWeight="semibold"
          foregroundStyle="tertiaryLabel"
          frame={{ width: 40, height: 34 }}
          background="clear"
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          dragMinimumDistance={4}
          accessibilityHidden
        />
      </ZStack>
    </VStack>
  );
}

/** Where the dragged card will land: a dashed slot the size of the card. */
export function Placeholder({ height, refFn }: { height: number; refFn: (node: HostInstance | null) => void }) {
  return (
    <VStack ref={refFn} padding={{ bottom: CARD_GAP }} transition="opacity">
      <RoundedRectangle
        cornerRadius={12}
        fill="accent/10"
        stroke="accent/50"
        lineWidth={1.5}
        dash={[6, 4]}
        frame={{ height: Math.max(height - CARD_GAP, 44) }}
      />
    </VStack>
  );
}
