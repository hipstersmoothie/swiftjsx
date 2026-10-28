// Create or edit a habit, in a sheet: name, icon, color, schedule, a daily
// target, and a reminder time. Validated with zod; errors show once a field
// has been touched (or on Save). With unsaved changes the sheet can't be
// swiped away, and Cancel asks first.
import { useState } from "react";
import { set as setTime, startOfToday } from "date-fns";
import { z } from "zod";
import {
  withAnimation, haptic, Navigator, Screen, ToolbarItem, Form, Section, SectionFooter, VStack, HStack, LazyVGrid, Text, Image, TextField,
  Button, Picker, Stepper, Toggle, ColorPicker, Spacer, Sheet, Alert, ConfirmationDialog, DatePicker,
} from "swiftjsx";
import { addHabit, deleteHabit, updateHabit, useHabits, type Habit, type HabitInput, type Schedule } from "./store";
import { formatTime, orderedWeekdays, useToday, weekdayName } from "./dates";
import { describeSchedule } from "./stats";
import { ICONS, PALETTE, normalizeHex, paletteName, type Hex } from "./theme";
import { HabitIcon } from "./ui";

type Draft = {
  name: string;
  icon: string;
  color: Hex;
  kind: Schedule["kind"];
  days: number[];
  times: number;
  target: number;
  unit: string;
  reminderOn: boolean;
  hour: number;
  minute: number;
};

function draftFrom(habit: Habit | undefined): Draft {
  return {
    name: habit?.name ?? "",
    icon: habit?.icon ?? "checkmark",
    color: habit?.color ?? PALETTE[7].hex,
    kind: habit?.schedule.kind ?? "daily",
    days: habit?.schedule.kind === "weekdays" ? habit.schedule.days : [1, 2, 3, 4, 5],
    times: habit?.schedule.kind === "weekly" ? habit.schedule.times : 3,
    target: habit?.target ?? 1,
    unit: habit?.unit ?? "",
    reminderOn: !!habit?.reminder,
    hour: habit?.reminder?.hour ?? 8,
    minute: habit?.reminder?.minute ?? 0,
  };
}

const scheduleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("daily") }),
  z.object({ kind: z.literal("weekdays"), days: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one day.") }),
  z.object({ kind: z.literal("weekly"), times: z.number().int().min(1).max(6, "Seven times a week is every day: choose Daily.") }),
]);

const habitSchema = z.object({
  name: z.string().trim().min(1, "Give the habit a name.").max(40, "Keep the name under 40 characters."),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a color."),
  schedule: scheduleSchema,
  target: z.number().int().min(1, "At least once a day.").max(99, "At most 99 a day."),
  unit: z.string().trim().max(16, "Keep the unit short (16 characters)."),
  reminder: z.object({ hour: z.number().int().min(0).max(23), minute: z.number().int().min(0).max(59) }).nullable(),
});

type Field = "name" | "schedule" | "target" | "unit";

/** The habit to save, or errors by field. */
function validate(draft: Draft, otherNames: string[]): { input: HabitInput | null; errors: Partial<Record<Field, string>> } {
  // Every day of the week picked is just "daily".
  const schedule: Schedule =
    draft.kind === "daily" || (draft.kind === "weekdays" && draft.days.length === 7) ? { kind: "daily" }
    : draft.kind === "weekdays" ? { kind: "weekdays", days: [...draft.days].sort() }
    : { kind: "weekly", times: draft.times };
  const result = habitSchema.safeParse({
    name: draft.name,
    icon: draft.icon,
    color: draft.color,
    schedule,
    target: draft.target,
    unit: draft.target > 1 ? draft.unit : "",
    reminder: draft.reminderOn ? { hour: draft.hour, minute: draft.minute } : null,
  });
  const errors: Partial<Record<Field, string>> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]) as Field;
      errors[field] ??= issue.message;
    }
  }
  // Names identify habits on screen (and in UI tests): keep them unique.
  const name = draft.name.trim().toLowerCase();
  if (name && otherNames.some((n) => n.trim().toLowerCase() === name)) errors.name ??= "You already have a habit with this name.";
  return { input: result.success && !Object.keys(errors).length ? (result.data as HabitInput) : null, errors };
}

/** The sheet: holds whether there are unsaved changes, so it can refuse the swipe down. */
export function HabitFormSheet({ isPresented, habit, onClose, onDelete }: {
  isPresented: boolean;
  habit?: Habit;
  onClose: () => void;
  /** After deleting (editing only). */
  onDelete?: () => void;
}) {
  // Sheet's interactiveDismissDisabled is a prop of the presenter, not
  // something the content can set, so the form reports up.
  const [dirty, setDirty] = useState(false);
  const close = () => {
    setDirty(false);
    onClose();
  };
  return (
    <Sheet isPresented={isPresented} onDismiss={close} interactiveDismissDisabled={dirty}>
      {/* A stack of its own, for the sheet's title and Cancel / Save. */}
      <Navigator>
        <HabitForm habit={habit} onClose={close} onDirtyChange={setDirty} onDelete={onDelete && (() => { setDirty(false); onDelete(); })} />
      </Navigator>
    </Sheet>
  );
}

function HabitForm({ habit, onClose, onDirtyChange, onDelete }: {
  habit?: Habit;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onDelete?: () => void;
}) {
  const today = useToday();
  const habits = useHabits((s) => s.habits);
  const [initial] = useState(() => draftFrom(habit));
  const [draft, setDraft] = useState(initial);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const otherNames = habits.filter((h) => h.id !== habit?.id).map((h) => h.name);
  const { input, errors } = validate(draft, otherNames);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const shown = (field: Field) => (submitted || touched[field] ? errors[field] : undefined);

  const update = (changes: Partial<Draft>, field?: Field) => {
    const next = { ...draft, ...changes };
    setDraft(next);
    if (field) setTouched((t) => ({ ...t, [field]: true }));
    onDirtyChange(JSON.stringify(next) !== JSON.stringify(initial));
  };

  const save = () => {
    setSubmitted(true);
    if (!input) {
      haptic("error");
      return;
    }
    haptic("success");
    withAnimation("snappy", () => {
      if (habit) updateHabit(habit.id, input);
      else addHabit(input, today);
    });
    onClose();
  };

  const reminderDate = setTime(startOfToday(), { hours: draft.hour, minutes: draft.minute });
  const isCustomColor = !PALETTE.some((p) => normalizeHex(p.hex) === normalizeHex(draft.color));
  const preview = { schedule: draft.kind === "weekdays" ? { kind: "weekdays" as const, days: draft.days } : draft.kind === "weekly" ? { kind: "weekly" as const, times: draft.times } : { kind: "daily" as const } };

  return (
    <Screen title={habit ? "Edit Habit" : "New Habit"} titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={() => (dirty ? setConfirmDiscard(true) : onClose())} accessibilityIdentifier="cancel-habit">
          <ConfirmationDialog isPresented={confirmDiscard} onDismiss={() => setConfirmDiscard(false)} title="Discard your changes?">
            <Button title="Discard Changes" role="destructive" onPress={onClose} />
            <Button title="Keep Editing" role="cancel" onPress={() => {}} />
          </ConfirmationDialog>
        </Button>
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        <Button title={habit ? "Save" : "Add"} fontWeight="semibold" disabled={!draft.name.trim() || (!!habit && !dirty)} onPress={save} accessibilityIdentifier="save-habit" />
      </ToolbarItem>

      <Form>
        <Section>
          <VStack spacing={14} padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }}>
            <HabitIcon icon={draft.icon} color={draft.color} size={84} />
            <TextField
              value={draft.name}
              onChange={(name) => update({ name })}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              autoFocus={!habit}
              placeholder="Habit Name"
              autocapitalize="words"
              submitLabel="done"
              font="title2"
              fontWeight="bold"
              padding={12}
              background="tertiarySystemFill"
              cornerRadius={12}
              accessibilityLabel="Habit name"
              accessibilityIdentifier="habit-name"
            />
            <Text font="footnote" foregroundStyle="secondaryLabel">
              {describeSchedule(preview, (d) => weekdayName(d), orderedWeekdays)}
              {draft.target > 1 ? ` · ${draft.target} ${draft.unit.trim() || "times"} a day` : ""}
              {draft.reminderOn ? ` · ${formatTime(draft.hour, draft.minute)}` : ""}
            </Text>
          </VStack>
          {shown("name") ? <ErrorFooter message={shown("name")!} /> : null}
        </Section>

        <Section header="Icon">
          <LazyVGrid columns={6} spacing={10}>
            {ICONS.map((name) => {
              const selected = name === draft.icon;
              return (
                <Image
                  key={name}
                  systemName={name}
                  font="title3"
                  foregroundStyle={selected ? "white" : "secondaryLabel"}
                  frame={{ width: 44, height: 44 }}
                  background={selected ? draft.color : "tertiarySystemFill"}
                  cornerRadius={12}
                  animation="snappy"
                  onTapGesture={() => {
                    haptic("selection");
                    update({ icon: name });
                  }}
                  accessibilityLabel={name.replace(/\.fill$/, "").replace(/\./g, " ")}
                  accessibilityTraits={selected ? ["button", "selected"] : "button"}
                  accessibilityIdentifier={`icon-${name}`}
                />
              );
            })}
          </LazyVGrid>
        </Section>

        <Section header="Color">
          <LazyVGrid columns={6} spacing={12}>
            {PALETTE.map((p) => {
              const selected = normalizeHex(p.hex) === normalizeHex(draft.color);
              return (
                <Image
                  key={p.hex}
                  systemName={selected ? "checkmark.circle.fill" : "circle.fill"}
                  font="largeTitle"
                  foregroundStyle={p.hex}
                  onTapGesture={() => {
                    haptic("selection");
                    update({ color: p.hex });
                  }}
                  accessibilityLabel={p.name}
                  accessibilityTraits={selected ? ["button", "selected"] : "button"}
                  accessibilityIdentifier={`color-${p.name}`}
                />
              );
            })}
          </LazyVGrid>
          <HStack>
            <Text>Custom</Text>
            {isCustomColor ? <Image systemName="checkmark" foregroundStyle="accent" fontWeight="semibold" /> : null}
            <Spacer />
            <ColorPicker value={draft.color} onChange={(hex) => update({ color: normalizeHex(hex) })} accessibilityLabel={`Custom color, ${paletteName(draft.color)}`} />
          </HStack>
        </Section>

        <Section header="Schedule">
          <Picker
            pickerStyle="segmented"
            value={draft.kind}
            onChange={(kind) => withAnimation("snappy", () => update({ kind: kind as Schedule["kind"] }, "schedule"))}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekdays", label: "Days" },
              { value: "weekly", label: "Weekly" },
            ]}
            accessibilityIdentifier="schedule-kind"
          />
          {draft.kind === "weekdays" ? (
            <VStack spacing={10} padding={{ vertical: 4 }}>
              <HStack spacing={0}>
                {orderedWeekdays.map((d) => {
                  const on = draft.days.includes(d);
                  return (
                    <Text
                      key={d}
                      font="subheadline"
                      fontWeight="semibold"
                      foregroundStyle={on ? "white" : "label"}
                      frame={{ width: 38, height: 38 }}
                      background={on ? draft.color : "tertiarySystemFill"}
                      cornerRadius="capsule"
                      animation="snappy"
                      onTapGesture={() => {
                        haptic("selection");
                        update({ days: on ? draft.days.filter((x) => x !== d) : [...draft.days, d] }, "schedule");
                      }}
                      accessibilityLabel={weekdayName(d, "long")}
                      accessibilityTraits={on ? ["button", "selected"] : "button"}
                      accessibilityIdentifier={`weekday-${d}`}
                    >
                      {weekdayName(d, "narrow")}
                    </Text>
                  );
                })}
              </HStack>
              <HStack spacing={8}>
                <Button title="Weekdays" buttonStyle="bordered" font="footnote" onPress={() => update({ days: [1, 2, 3, 4, 5] }, "schedule")} />
                <Button title="Weekends" buttonStyle="bordered" font="footnote" onPress={() => update({ days: [0, 6] }, "schedule")} />
                <Spacer />
              </HStack>
            </VStack>
          ) : null}
          {draft.kind === "weekly" ? (
            <Stepper
              value={draft.times}
              min={1}
              max={6}
              onChange={(times) => update({ times }, "schedule")}
              label={draft.times === 1 ? "Once a week" : `${draft.times} times a week`}
              accessibilityIdentifier="times-per-week"
            />
          ) : null}
          <SectionFooter>
            {shown("schedule") ? (
              <ErrorText message={shown("schedule")!} />
            ) : (
              <Text>
                {draft.kind === "daily"
                  ? "Due every day."
                  : draft.kind === "weekdays"
                    ? "Due on the days you pick. Other days don’t break your streak."
                    : "Any days you like. Streaks count the weeks you hit your goal."}
              </Text>
            )}
          </SectionFooter>
        </Section>

        <Section header="Daily Goal">
          <Stepper
            value={draft.target}
            min={1}
            max={99}
            onChange={(target) => update({ target }, "target")}
            label={draft.target === 1 ? "Once a day" : `${draft.target} times a day`}
            accessibilityIdentifier="daily-target"
          />
          {draft.target > 1 ? (
            <TextField
              value={draft.unit}
              onChange={(unit) => update({ unit }, "unit")}
              placeholder="Unit (glasses, pages…)"
              textFieldStyle="plain"
              autocapitalize="none"
              accessibilityIdentifier="habit-unit"
            />
          ) : null}
          <SectionFooter>
            {shown("target") || shown("unit") ? (
              <ErrorText message={(shown("target") ?? shown("unit"))!} />
            ) : (
              <Text>{draft.target > 1 ? "Each tap on the ring counts one. Touch and hold it to undo." : "One tap on the ring and it’s done."}</Text>
            )}
          </SectionFooter>
        </Section>

        <Section header="Reminder">
          <Toggle label="Remind Me" value={draft.reminderOn} onChange={(reminderOn) => withAnimation("snappy", () => update({ reminderOn }))} accessibilityIdentifier="reminder-toggle" />
          {draft.reminderOn ? (
            <DatePicker
              label="Time"
              components="hourAndMinute"
              value={reminderDate}
              onChange={(d) => update({ hour: d.getHours(), minute: d.getMinutes() })}
              accessibilityIdentifier="reminder-time"
            />
          ) : null}
          <SectionFooter>
            <Text>The time is local: it follows you across time zones and daylight saving.</Text>
          </SectionFooter>
        </Section>

        {habit && onDelete ? (
          <Section>
            <Button title="Delete Habit" role="destructive" onPress={() => setConfirmDelete(true)} accessibilityIdentifier="delete-habit" />
          </Section>
        ) : null}
      </Form>

      <Alert
        isPresented={confirmDelete}
        onDismiss={() => setConfirmDelete(false)}
        title={`Delete “${habit?.name ?? ""}”?`}
        message="Its history and streaks are deleted too. This can’t be undone."
      >
        <Button
          title="Delete"
          role="destructive"
          onPress={() => {
            const id = habit?.id;
            onDelete?.();
            if (id) withAnimation("snappy", () => deleteHabit(id));
          }}
        />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <Text foregroundStyle="red" accessibilityIdentifier="form-error">
      <Image systemName="exclamationmark.circle.fill" /> {message}
    </Text>
  );
}

function ErrorFooter({ message }: { message: string }) {
  return (
    <SectionFooter>
      <ErrorText message={message} />
    </SectionFooter>
  );
}
