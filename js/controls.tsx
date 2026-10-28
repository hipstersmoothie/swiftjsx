// Components built from the host components: date pickers that take Dates,
// and iOS-style navigation rows.

import type { ComponentProps, ReactNode } from "react";
import { Button, HStack, VStack, Image, Text, Spacer, PickerHost, type Modifiers, type ColorValue } from "./components";

const DatePickerHost = "DatePicker" as unknown as (props: any) => ReactNode;

type DatePickerProps = Modifiers & {
  value: Date | number;
  onChange: (date: Date) => void;
  /** Without a label, only the control shows. */
  label?: string;
  /** What to pick: a day (default), a time, or both. */
  components?: "date" | "hourAndMinute" | "dateAndTime";
  /** "compact" (a button that opens a calendar), "graphical" (an inline calendar), or "wheel". */
  datePickerStyle?: "automatic" | "compact" | "graphical" | "wheel";
  min?: Date | number;
  max?: Date | number;
  tint?: ColorValue;
};

export function DatePicker({ value, onChange, min, max, ...props }: DatePickerProps) {
  const ms = (d: Date | number | undefined) => (d === undefined ? undefined : typeof d === "number" ? d : d.getTime());
  return <DatePickerHost {...props} value={ms(value)} min={ms(min)} max={ms(max)} onChange={(t: number) => onChange(new Date(t))} />;
}

export type TimeOfDay = { hour: number; minute: number };

type TimePickerProps = Modifiers & {
  /** 0–23 and 0–59, in the device's time zone. */
  value: TimeOfDay;
  onChange: (time: TimeOfDay) => void;
  label?: string;
  datePickerStyle?: "automatic" | "compact" | "wheel";
  /** Picked times snap to multiples of this many minutes (the control still lists every minute). */
  minuteInterval?: number;
  min?: TimeOfDay;
  max?: TimeOfDay;
  tint?: ColorValue;
};

/** A time of day (alarms, reminders, opening hours): no dates or time zones to carry around. */
export function TimePicker({ value, onChange, min, max, minuteInterval, ...props }: TimePickerProps) {
  const today = (t: TimeOfDay | undefined) => (t === undefined ? undefined : new Date().setHours(t.hour, t.minute, 0, 0));
  const change = (ms: number) => {
    const date = new Date(ms);
    let minutes = date.getHours() * 60 + date.getMinutes();
    if (minuteInterval && minuteInterval > 1) minutes = (Math.round(minutes / minuteInterval) * minuteInterval) % (24 * 60);
    onChange({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
  };
  return <DatePickerHost {...props} components="hourAndMinute" value={today(value)} min={today(min)} max={today(max)} onChange={change} />;
}

type NavigationRowProps = Modifiers & {
  title?: string;
  subtitle?: string;
  /** An SF Symbol in a rounded square, like Settings. */
  systemImage?: string;
  iconColor?: ColorValue;
  /** Shown before the chevron (the current value of a setting). */
  value?: string;
  onPress: () => void;
  /** A count or short text before the chevron. */
  badge?: number | string;
  /** Custom content instead of title / subtitle. */
  children?: ReactNode;
};

/** A List row that navigates: full-width tap with highlight, a value, and a chevron. */
export function NavigationRow({ title, subtitle, systemImage, iconColor = "gray", value, badge, onPress, children, ...modifiers }: NavigationRowProps) {
  return (
    <Button onPress={onPress} tint="primary" {...modifiers}>
      <HStack spacing={12}>
        {systemImage ? (
          <Image systemName={systemImage} font="callout" foregroundStyle="white" frame={{ width: 29, height: 29 }} background={iconColor} cornerRadius={7} />
        ) : null}
        {children ?? (
          <VStack alignment="leading" spacing={2}>
            <Text>{title}</Text>
            {subtitle ? <Text font="caption" foregroundStyle="secondary">{subtitle}</Text> : null}
          </VStack>
        )}
        <Spacer />
        {value != null ? <Text foregroundStyle="secondary" lineLimit={1}>{value}</Text> : null}
        {badge ? (
          <Text font="footnote" fontWeight="semibold" foregroundStyle="white" padding={{ horizontal: 7, vertical: 2 }} background="red" cornerRadius="capsule">
            {String(badge)}
          </Text>
        ) : null}
        <Image systemName="chevron.right" font="footnote" fontWeight="semibold" foregroundStyle="tertiary" />
      </HStack>
    </Button>
  );
}

type PickerOption<T> = { value: T; label: string; systemImage?: string };

/**
 * A picker of `options`; values can be strings or numbers (onChange gets
 * the option's own value back).
 */
export function Picker<T extends string | number>({
  value,
  onChange,
  options,
  ...props
}: Omit<ComponentProps<typeof PickerHost>, "value" | "onChange" | "options"> & {
  value: T;
  onChange: (value: T) => void;
  options: PickerOption<T>[];
}) {
  return (
    <PickerHost
      {...props}
      value={String(value)}
      onChange={(text) => {
        const option = options.find((o) => String(o.value) === text);
        if (option) onChange(option.value);
      }}
      options={options.map((o) => ({ ...o, value: String(o.value) }))}
    />
  );
}
