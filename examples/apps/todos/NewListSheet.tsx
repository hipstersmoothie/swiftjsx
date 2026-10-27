import { useEffect, useRef, useState } from "react";
import {
  withAnimation, Navigator, Screen, ToolbarItem, Form, Section, VStack, LazyVGrid, Image, TextField, Button, Sheet,
  type Color, type HostInstance,
} from "swiftjsx";
import { addList } from "./store";

const colors: Color[] = ["red", "orange", "yellow", "green", "mint", "teal", "cyan", "blue", "indigo", "purple", "pink", "brown"];
const icons = [
  "list.bullet", "bookmark.fill", "star.fill", "cart.fill", "house.fill", "briefcase.fill",
  "graduationcap.fill", "book.fill", "gift.fill", "airplane", "heart.fill", "leaf.fill",
];

/**
 * Change `formKey` each time it opens for a fresh form. (Rendering the form
 * only while presented would blank the sheet during its dismiss animation.)
 */
export function NewListSheet({ isPresented, formKey, onClose }: { isPresented: boolean; formKey: number; onClose(): void }) {
  return (
    <Sheet isPresented={isPresented} onDismiss={onClose} detents={["large"]}>
      {/* A stack of its own, for the sheet's title and Cancel / Done buttons. */}
      <Navigator>
        <NewListForm key={formKey} onClose={onClose} />
      </Navigator>
    </Sheet>
  );
}

function NewListForm({ onClose }: { onClose(): void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<Color>("blue");
  const [icon, setIcon] = useState("list.bullet");
  const input = useRef<HostInstance>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

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
            <Image
              systemName={icon}
              font="largeTitle"
              foregroundStyle="white"
              frame={{ width: 88, height: 88 }}
              background={color}
              cornerRadius={44}
              shadow={{ radius: 8, y: 4 }}
              animation="snappy"
              accessibilityHidden
            />
            <TextField
              ref={input}
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
