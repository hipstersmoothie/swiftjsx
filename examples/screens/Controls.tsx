import { useRef, useState } from "react";
import {
  Screen, List, Section, SectionHeader, Text, TextField, TextEditor, DatePicker, ColorPicker, Menu, Button, Divider,
  NavigationRow, Flow, Grid, GridRow, HStack, VStack, Image, Overlay, Circle, EditButton, ToolbarItem, Sheet, haptic, Picker, Toggle, MenuLabel, Spacer, type HostInstance,
  type Color,
} from "swiftjsx";

const tags = ["react", "swiftui", "jsx", "hooks", "worklets", "fetch", "zustand", "tanstack-query", "zod", "date-fns"];

export function ControlsDemo() {
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("Builds SwiftUI with React.");
  const [notes, setNotes] = useState("");
  const [birthday, setBirthday] = useState(new Date(1990, 4, 17));
  const [accent, setAccent] = useState("#5856d6");
  const [sort, setSort] = useState("date");
  const [items, setItems] = useState(["Milk", "Eggs", "Bread", "Coffee"]);
  const [editing, setEditing] = useState<string | null>(null);
  const [likes, setLikes] = useState(0);
  const [showCompleted, setShowCompleted] = useState(true);
  const [presses, setPresses] = useState(0);
  const [water, setWater] = useState(0);
  const [taps, setTaps] = useState({ taps: 0, holds: 0 });
  const [mentions, setMentions] = useState(0);
  const [opened, setOpened] = useState("nothing");
  const [truncated, setTruncated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState(false);
  const [code, setCode] = useState(["", "", "", ""]);
  const [codeFocus, setCodeFocus] = useState<number | null>(null);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [field, setField] = useState<"first" | "second" | null>(null);
  const [cursor, setCursor] = useState({ start: 0, end: 0 });
  const firstField = useRef<HostInstance>(null);

  return (
    <Screen title="Controls & layout" titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="ellipsis.circle" accessibilityLabel="More">
          <Picker label="Sort by" value={sort} onChange={setSort} options={[{ value: "date", label: "Date", systemImage: "calendar" }, { value: "name", label: "Name", systemImage: "textformat" }]} />
          <Toggle label="Show completed" value={showCompleted} onChange={setShowCompleted} />
          <Menu title="Share" systemImage="square.and.arrow.up">
            <Button title="Copy link" onPress={() => navigator.clipboard.writeText("https://github.com/hipstersmoothie/swiftjsx")} />
            <Button title="Mail" onPress={() => {}} />
          </Menu>
          <Divider />
          <Button title="Delete all" role="destructive" onPress={() => setItems([])} />
        </Menu>
      </ToolbarItem>
      <ToolbarItem placement="primaryAction">
        <EditButton />
      </ToolbarItem>

      <List listStyle="insetGrouped">
        <Section header="Text input">
          <TextField placeholder="Email" value={email} onChange={setEmail} keyboardType="email" textContentType="email" autocapitalize="none" autocorrect={false} submitLabel="next" textFieldStyle="plain" />
          <TextField placeholder="Bio" value={bio} onChange={setBio} axis="vertical" maxLines={4} textFieldStyle="plain" />
          <TextEditor placeholder="Notes…" value={notes} onChange={setNotes} frame={{ height: 90 }} />
        </Section>

        <Section header="Focus and selection" footer={`Cursor ${cursor.start}–${cursor.end}`}>
          <TextField
            placeholder="First"
            value={first}
            onChange={setFirst}
            textFieldStyle="plain"
            focused={field === "first"}
            onFocus={() => setField("first")}
            onBlur={() => setField((f) => (f === "first" ? null : f))}
            ref={firstField}
            onSelectionChange={setCursor}
            submitLabel="next"
            onSubmit={() => setField("second")}
            accessibilityIdentifier="first-field"
          />
          <TextField
            placeholder="Second"
            value={second}
            onChange={setSecond}
            textFieldStyle="plain"
            focused={field === "second"}
            onFocus={() => setField("second")}
            onBlur={() => setField((f) => (f === "second" ? null : f))}
            accessibilityIdentifier="second-field"
          />
          <HStack spacing={12}>
            <Button title="Next field" buttonStyle="bordered" onPress={() => setField(field === "first" ? "second" : "first")} accessibilityIdentifier="next-field" />
            <Button
              title="Insert ★"
              buttonStyle="bordered"
              onPress={() => {
                const at = Math.min(cursor.start, first.length);
                setFirst(first.slice(0, at) + "★" + first.slice(Math.min(cursor.end, first.length)));
                firstField.current?.setSelection(at + 1);
              }}
              accessibilityIdentifier="insert-star"
            />
            <Button title="To start" buttonStyle="bordered" onPress={() => firstField.current?.setSelection(0)} accessibilityIdentifier="cursor-start" />
          </HStack>
        </Section>

        <Section header="Pickers">
          <DatePicker label="Birthday" value={birthday} onChange={setBirthday} max={new Date()} />
          <ColorPicker label="Accent" value={accent} onChange={setAccent} />
          <Text font="footnote" foregroundStyle="secondary">Born {birthday.toDateString()} · {accent}</Text>
        </Section>

        <Section
          onDelete={(indices) => setItems((list) => list.filter((_, i) => !indices.includes(i)))}
          onMove={({ from, to }) =>
            setItems((list) => {
              const moving = from.map((i) => list[i]);
              const rest = list.filter((_, i) => !from.includes(i));
              const at = to - from.filter((i) => i < to).length;
              return [...rest.slice(0, at), ...moving, ...rest.slice(at)];
            })
          }
        >
          <SectionHeader>
            <Image systemName="cart" />
            <Text>Groceries · swipe to delete, Edit to reorder</Text>
          </SectionHeader>
          {/* onDelete/onMove act on this Section's rows. */}
          {items.map((item) => (
            <NavigationRow key={item} title={item} value="1" onPress={() => setEditing(item)} />
          ))}
        </Section>

        <Section header="Code entry" footer={`Code: ${code.join("") || "–"}`}>
          <HStack spacing={10}>
            {code.map((digit, i) => (
              <TextField
                key={i}
                value={digit}
                onChange={(text) => {
                  const d = text.replace(/\D/g, "").slice(-1);
                  setCode((c) => c.map((x, j) => (j === i ? d : x)));
                  if (d && i < 3) setCodeFocus(i + 1);
                }}
                // Delete in an empty box steps back and clears the previous one.
                onDeleteBackward={({ empty }) => {
                  if (!empty || i === 0) return;
                  setCode((c) => c.map((x, j) => (j === i - 1 ? "" : x)));
                  setCodeFocus(i - 1);
                }}
                focused={codeFocus === i}
                onFocus={() => setCodeFocus(i)}
                keyboardType="number"
                textAlignment="center"
                font={{ size: 24, weight: "semibold", design: "monospaced" }}
                frame={{ width: 48, height: 56 }}
                textFieldStyle="roundedBorder"
                accessibilityIdentifier={`code-${i}`}
              />
            ))}
          </HStack>
        </Section>

        <Section header="Rich text">
          <Text accessibilityIdentifier="rich-text">
            Built by{" "}
            <Text foregroundStyle="blue" fontWeight="semibold" onPress={() => setMentions((n) => n + 1)}>
              @swiftjsx
            </Text>{" "}
            with a <Text background="yellow/40">highlighted</Text> run · mentions tapped: {mentions}
          </Text>
          <Text markdown={`An in-app link: [open user 42](app://user/42) · opened ${opened}`} onOpenURL={setOpened} accessibilityIdentifier="link-text" />
          <VStack alignment="leading" spacing={4}>
            <Text lineLimit={expanded ? undefined : 2} onTruncationChange={setTruncated} accessibilityIdentifier="long-text">
              SwiftJSX renders React components as SwiftUI views. Each host element maps to a view, props become modifiers, and
              React's reconciler drives updates from a JavaScript thread, so the main thread stays free for scrolling and animation.
            </Text>
            {truncated && !expanded ? (
              <Button title="more" buttonStyle="borderless" onPress={() => setExpanded(true)} accessibilityIdentifier="more" />
            ) : null}
          </VStack>
          <HStack>
            <Toggle label="Done" value={checked} onChange={setChecked} />
            {checked ? <Image systemName="checkmark.circle.fill" foregroundStyle="green" font="title2" symbolEffect={{ type: "bounce", onAppear: true }} /> : null}
          </HStack>
        </Section>

        <Section header="Tap or hold">
          <Button
            title={`Taps ${taps.taps} · holds ${taps.holds}`}
            onPress={() => setTaps((t) => ({ ...t, taps: t.taps + 1 }))}
            onLongPress={() => {
              haptic("medium");
              setTaps((t) => ({ ...t, holds: t.holds + 1 }));
            }}
            accessibilityIdentifier="tap-or-hold"
          />
        </Section>

        <Section header="Menu with a custom label" footer="Tap adds one; hold for more.">
          <HStack>
            <Text>Glasses of water</Text>
            <Spacer />
            <Menu onPress={() => setWater((w) => w + 1)} accessibilityIdentifier="water-menu">
              <MenuLabel>
                <Text font={{ size: 17, weight: "bold", design: "rounded" }} foregroundStyle="white" frame={{ width: 44, height: 44 }} background="blue" cornerRadius="capsule">
                  {water}
                </Text>
              </MenuLabel>
              <Button title="Add two" systemImage="plus" onPress={() => setWater((w) => w + 2)} />
              <Button title="Reset" systemImage="arrow.counterclockwise" role="destructive" onPress={() => setWater(0)} />
            </Menu>
          </HStack>
        </Section>

        <Section header="Rows">
          <NavigationRow title="Wi-Fi" systemImage="wifi" iconColor="blue" value="Home" onPress={() => haptic("selection")} />
          <NavigationRow title="Notifications" systemImage="bell.badge.fill" iconColor="red" onPress={() => haptic("success")} badge={3} />
          <HStack listRowBackground="indigo/10">
            <Image systemName="heart.fill" foregroundStyle="pink" symbolEffect={{ type: "bounce", value: likes }} />
            <Text>Likes: {likes}</Text>
            <Button title="Like" buttonStyle="bordered" onPress={() => { setLikes((n) => n + 1); haptic("light"); }} />
          </HStack>
          <Button
            onPress={() => setPresses((n) => n + 1)}
            pressedScale={0.94}
            pressedBackground="accent/15"
            onPressIn={() => haptic("light")}
            accessibilityIdentifier="pressable"
          >
            <Text padding={{ vertical: 6 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>Press and hold me · {presses}</Text>
          </Button>
          <HStack spacing={16}>
            <Image systemName="cloud.sun.rain.fill" symbolRenderingMode="multicolor" font="title" />
            <Image systemName="person.crop.circle.badge.checkmark" symbolRenderingMode="palette" paletteColors={["green", "gray"]} font="title" />
            <Image systemName="wifi" variableValue={0.5} font="title" />
            <Image systemName="antenna.radiowaves.left.and.right" symbolEffect={{ type: "variableColor", active: true }} font="title" foregroundStyle="blue" />
          </HStack>
        </Section>

        <Section header="Flow & grid">
          <Flow spacing={6}>
            {tags.map((tag) => (
              <Text key={tag} font="caption" padding={{ horizontal: 10, vertical: 5 }} background={"accent/15" as Color} foregroundStyle="accent" cornerRadius="capsule">#{tag}</Text>
            ))}
          </Flow>
          <Grid horizontalSpacing={12} verticalSpacing={8}>
            <GridRow>
              <Text fontWeight="semibold">Plan</Text>
              <Text fontWeight="semibold">Price</Text>
              <Text fontWeight="semibold">Seats</Text>
            </GridRow>
            <GridRow>
              <Text>Starter</Text>
              <Text monospacedDigit>$0</Text>
              <Text>1</Text>
            </GridRow>
            <GridRow>
              <Text>Team plan</Text>
              <Text monospacedDigit>$12</Text>
              <Text>10</Text>
            </GridRow>
            <GridRow>
              <Text gridColumns={3} font="footnote" foregroundStyle="secondary">A cell spanning all three columns.</Text>
            </GridRow>
          </Grid>
          <Image systemName="envelope.fill" font="largeTitle" foregroundStyle="blue" padding={6}>
            <Overlay alignment="topTrailing">
              <Text font="caption2" fontWeight="bold" foregroundStyle="white" padding={{ horizontal: 6, vertical: 2 }} background="red" cornerRadius="capsule" accessibilityIdentifier="mail-badge">12</Text>
            </Overlay>
          </Image>
        </Section>
      </List>

      <Sheet item={editing} onDismiss={() => setEditing(null)} detents={["medium"]}>
        {(item) => <EditItem item={item} onDone={() => setEditing(null)} />}
      </Sheet>
    </Screen>
  );
}

function EditItem({ item, onDone }: { item: string; onDone(): void }) {
  const [name, setName] = useState(item);
  return (
    <List>
      <Section header={`Editing ${item}`}>
        <TextField value={name} onChange={setName} autoFocus textFieldStyle="plain" />
        <Button title="Done" onPress={onDone} />
      </Section>
    </List>
  );
}
