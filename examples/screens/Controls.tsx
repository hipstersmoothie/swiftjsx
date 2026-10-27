import { useState } from "react";
import {
  Screen, List, Section, SectionHeader, Text, TextField, TextEditor, DatePicker, ColorPicker, Menu, Button, Divider,
  NavigationRow, Flow, Grid, GridRow, HStack, Image, Overlay, Circle, EditButton, ToolbarItem, Sheet, haptic, Picker,
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

  return (
    <Screen title="Controls & layout" titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="ellipsis.circle" accessibilityLabel="More">
          <Picker label="Sort by" value={sort} onChange={setSort} options={[{ value: "date", label: "Date" }, { value: "name", label: "Name" }]} />
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

        <Section header="Rows">
          <NavigationRow title="Wi-Fi" systemImage="wifi" iconColor="blue" value="Home" onPress={() => haptic("selection")} />
          <NavigationRow title="Notifications" systemImage="bell.badge.fill" iconColor="red" onPress={() => haptic("success")} badge={3} />
          <HStack listRowBackground="indigo/10">
            <Image systemName="heart.fill" foregroundStyle="pink" symbolEffect={{ type: "bounce", value: likes }} />
            <Text>Likes: {likes}</Text>
            <Button title="Like" buttonStyle="bordered" onPress={() => { setLikes((n) => n + 1); haptic("light"); }} />
          </HStack>
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
