import { useCallback, useRef, useState, type ReactNode, type Ref } from "react";
import type { Modifiers, ScrollProps } from "./components";
import type { HostInstance } from "./renderer";

export type VirtualListProps<T> = Omit<Modifiers, "ref"> & ScrollProps & {
  data: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  /** Placeholder height for rows React hasn't rendered yet. */
  estimatedItemHeight?: number;
  /**
   * Start scrolled to this row (its top at the top), once the data has it;
   * changing it scrolls again. A thread: the focused post, with the replies it
   * answers loading above it.
   */
  initialScrollIndex?: number;
  /**
   * Every row is exactly this tall. Fastest option (like FlatList's
   * getItemLayout): no measuring, and no jump when a placeholder becomes a row.
   */
  itemHeight?: number;
  /**
   * Minimum rows to keep rendered beyond the visible ones. In the scroll
   * direction it renders at least two screens ahead, so fast flings don't
   * outrun React.
   */
  overscan?: number;
  /** Space between rows in the stack style (default 0). */
  spacing?: number;
  /**
   * A grid: a column count, or `{ minimum }` for as many as fit. Only the
   * visible cells are rendered, as with rows.
   */
  columns?: number | { minimum: number; maximum?: number };
  /**
   * "stack" (default): a LazyVStack in a ScrollView; fast at any depth.
   * "list": the inset-grouped list look (separators, grouped background). On
   * iOS it's a UICollectionView list hosting your rows, as fast at row 50,000
   * as at row 0; a large navigation title doesn't collapse into an inline
   * one over it, so pair it with `titleDisplayMode="inline"`. Elsewhere it's
   * SwiftUI's List, which slows down far into long lists.
   */
  listStyle?: "list" | "stack";
  /** iOS, listStyle="list": "insetGrouped" (default), "grouped" or "plain". */
  listAppearance?: "insetGrouped" | "grouped" | "plain";
  /** Called when the visible rows come within `onEndReachedThreshold` rows of the end (once per data length). */
  onEndReached?: () => void;
  /** Rows from the end at which `onEndReached` fires (default 10). */
  onEndReachedThreshold?: number;
  /** `ref.current.scrollTo(index)` scrolls to a row, even one not rendered yet. */
  ref?: Ref<HostInstance>;
  /**
   * Full-width content above / below the rows that scrolls with them (a home
   * screen's chips and carousel above a product grid; a loading footer).
   * Stack style only.
   */
  header?: ReactNode;
  footer?: ReactNode;
  /** Attachments (`<Overlay>`, `<SafeAreaInset>`, `<Sheet>`…); rows come from `data`. */
  children?: ReactNode;
};

type Range = { start: number; end: number };

const VirtualListHost = "VirtualList" as unknown as (props: any) => ReactNode;
const VirtualListHeader = "VirtualListHeader" as unknown as (props: { children: ReactNode }) => ReactNode;
const VirtualListFooter = "VirtualListFooter" as unknown as (props: { children: ReactNode }) => ReactNode;
const VirtualRow = "VirtualRow" as unknown as (props: { index: number; children: ReactNode }) => ReactNode;

/**
 * A FlatList-style list: SwiftUI lays out `data.length` lazy slots and reports
 * which are on screen; React only renders those (plus `overscan`). A 100k-row
 * list costs about as much as a 30-row one.
 */
export function VirtualList<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemHeight = 44,
  overscan = 10,
  onEndReached,
  onEndReachedThreshold = 10,
  header,
  footer,
  children,
  ...rest
}: VirtualListProps<T>) {
  const [range, setRange] = useState<Range>({ start: 0, end: Math.min(data.length, overscan * 4) });
  const previousFirst = useRef(0);
  const endReachedAt = useRef(-1);

  const onRangeChange = useCallback(
    ({ first, last }: { first: number; last: number }) => {
      if (onEndReached && last >= data.length - 1 - onEndReachedThreshold && endReachedAt.current !== data.length) {
        endReachedAt.current = data.length;
        onEndReached();
      }
      const down = first >= previousFirst.current;
      previousFirst.current = first;
      setRange((r) => {
        // Lead: how far past the visible rows we render, biased toward where
        // the user is scrolling. Refill once half the lead is used up.
        const ahead = Math.max(overscan, 2 * (last - first + 1));
        const behind = overscan;
        const leadBelow = r.end - 1 - last;
        const leadAbove = first - r.start;
        const visibleOutside = first < r.start || last >= r.end;
        const runningOut = down ? r.end < data.length && leadBelow < ahead / 2 : r.start > 0 && leadAbove < ahead / 2;
        if (!visibleOutside && !runningOut) return r;
        return down
          ? { start: Math.max(0, first - behind), end: Math.min(data.length, last + ahead + 1) }
          : { start: Math.max(0, first - ahead), end: Math.min(data.length, last + behind + 1) };
      });
    },
    [overscan, data.length, onEndReached, onEndReachedThreshold],
  );

  const rows: ReactNode[] = [];
  const end = Math.min(range.end, data.length);
  for (let i = range.start; i < end; i++) {
    rows.push(
      <VirtualRow key={keyExtractor ? keyExtractor(data[i], i) : i} index={i}>
        {renderItem(data[i], i)}
      </VirtualRow>,
    );
  }

  return (
    <VirtualListHost {...rest} count={data.length} estimatedItemHeight={estimatedItemHeight} onRangeChange={onRangeChange}>
      {children}
      {header != null ? <VirtualListHeader>{header}</VirtualListHeader> : null}
      {footer != null ? <VirtualListFooter>{footer}</VirtualListFooter> : null}
      {rows}
    </VirtualListHost>
  );
}
