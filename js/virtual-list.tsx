import { useCallback, useRef, useState, type ReactNode, type Ref } from "react";
import type { Modifiers } from "./components";
import type { HostInstance } from "./renderer";

export type VirtualListProps<T> = Omit<Modifiers, "ref"> & {
  data: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  /** Placeholder height for rows React hasn't rendered yet. */
  estimatedItemHeight?: number;
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
  /** `ref.current.scrollTo(index)` scrolls to a row, even one not rendered yet. */
  ref?: Ref<HostInstance>;
};

type Range = { start: number; end: number };

const VirtualListHost = "VirtualList" as unknown as (props: any) => ReactNode;
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
  ...rest
}: VirtualListProps<T>) {
  const [range, setRange] = useState<Range>({ start: 0, end: Math.min(data.length, overscan * 4) });
  const previousFirst = useRef(0);

  const onRangeChange = useCallback(
    ({ first, last }: { first: number; last: number }) => {
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
    [overscan, data.length],
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
      {rows}
    </VirtualListHost>
  );
}
