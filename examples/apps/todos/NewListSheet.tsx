import { useState } from "react";
import {
  withAnimation, Navigator, Screen, ToolbarItem, Form, Section, VStack, LazyVGrid, Image, IconTile, TextField, Button, Sheet,
  type Color,
} from "swiftjsx";
import { addList } from "./store";

const colors: Color[] = ["red", "orange", "yellow", "green", "mint", "teal", "cyan", "blue", "indigo", "purple", "pink", "brown"];
const icons = [
  "list.bullet", "bookmark.fill", "star.fill", "cart.fill", "house.fill", "briefcase.fill",
  "graduationcap.fill", "book.fill", "gift.fill", "airplane", "heart.fill", "leaf.fill",
];

/** The form starts fresh each time the sheet opens. */
export function NewListSheet({ isPresented, onClose }: { isPresented: boolean; onClose(): void }) {
  return (
    <Sheet isPresented={isPresented} onDismiss={onClose} detents={["large"]}>
      {/* A stack of its own, for the sheet's title and Cancel / Done buttons. */}
      <Navigator>
        <NewListForm onClose={onClose} />
      </Navigator>
    </Sheet>
  );
}

function NewListForm({ onClose }: { onClose(): void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<Color>("blue");
  const [icon, setIcon] = useState("list.bullet");

  const save = () => {
    if (!name.trim()) return;
    withAnimation("snappy", () => addList({ name: name.trim(), color, icon }));
    onClose();
  };

  return (
    <Screen title="New List" titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={onClose} />
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        <Button title="Done" fontWeight="semibold" disabled={!name.trim()} onPress={save} />
      </ToolbarItem>

      <Form>
        <Section>
          <VStack spacing={16} padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }}>
            <IconTile systemImage={icon} color={color} size={88} shape="circle" font="largeTitle" shadow={{ radius: 8, y: 4 }} animation="snappy" />
            <TextField
              autoFocus
              value={name}
              onChange={setName}
              onSubmit={save}
              placeholder="List Name"
              font="title2"
              fontWeight="bold"
              padding={12}
              background="#8882"
              cornerRadius={12}
              accessibilityLabel="List name"
              accessibilityIdentifier="new-list-name"
            />
          </VStack>
        </Section>
        <Section header="Color">
          <LazyVGrid columns={6} spacing={12}>
            {colors.map((c) => (
              <Image
                key={c}
                systemName={c === color ? "checkmark.circle.fill" : "circle.fill"}
                font="largeTitle"
                foregroundStyle={c}
                onTapGesture={() => setColor(c)}
                accessibilityLabel={c}
                accessibilityTraits={c === color ? ["button", "selected"] : "button"}
              />
            ))}
          </LazyVGrid>
        </Section>
        <Section header="Icon">
          <LazyVGrid columns={6} spacing={12}>
            {icons.map((name) => (
              <Image
                key={name}
                systemName={name}
                font="title3"
                foregroundStyle={name === icon ? "white" : "secondary"}
                frame={{ width: 44, height: 44 }}
                background={name === icon ? color : "#8882"}
                cornerRadius={22}
                onTapGesture={() => setIcon(name)}
                accessibilityLabel={name.replace(".fill", "").replace(/\./g, " ")}
                accessibilityTraits={name === icon ? ["button", "selected"] : "button"}
              />
            ))}
          </LazyVGrid>
        </Section>
      </Form>
    </Screen>
  );
}
