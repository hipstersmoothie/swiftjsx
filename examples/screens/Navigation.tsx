import { useState } from "react";
import {
  useNavigation, Screen, ToolbarItem, ScrollView, VStack, HStack, Text, Button, Image,
  Sheet, Alert, ConfirmationDialog, Form, Section, TextField, Toggle, Spacer,
} from "swiftjsx";

// Each pushed copy is its own component instance with its own state.
export function NavigationDemo({ depth }: { depth: number }) {
  const nav = useNavigation();
  const [likes, setLikes] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastAction, setLastAction] = useState("none yet");

  return (
    <Screen title={`Level ${depth}`}>
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => setSheetOpen(true)}>
          <Image systemName="square.and.pencil" />
        </Button>
      </ToolbarItem>

      <ScrollView>
        <VStack alignment="leading" spacing={14} padding={20}>
          <Text font="title2" fontWeight="semibold">Stack depth {nav.depth}</Text>
          <Text foregroundStyle="secondary">
            This screen's like counter is local state. Push another level, like it, go back: each level kept its own.
          </Text>
          <HStack>
            <Button buttonStyle="bordered" onPress={() => setLikes((n) => n + 1)}>
              <Image systemName={likes ? "heart.fill" : "heart"} foregroundStyle="pink" />
            </Button>
            <Text monospacedDigit animation="bouncy">{likes}</Text>
          </HStack>

          <Button title={`Push level ${depth + 1}`} buttonStyle="borderedProminent" onPress={() => nav.push(<NavigationDemo depth={depth + 1} />)} />
          {nav.depth > 1 && <Button title="Pop to root" buttonStyle="bordered" onPress={nav.popToRoot} />}

          <Text font="headline" padding={{ top: 12 }}>Presentations</Text>
          <HStack spacing={8}>
            <Button title="Sheet" buttonStyle="bordered" onPress={() => setSheetOpen(true)} />
            <Button title="Alert" buttonStyle="bordered" onPress={() => setAlertOpen(true)} />
            {/* Nested in its trigger, so the dialog's popover points at this button. */}
            <Button title="Dialog" buttonStyle="bordered" onPress={() => setDialogOpen(true)}>
              <ConfirmationDialog isPresented={dialogOpen} onDismiss={() => setDialogOpen(false)} title="Share to">
                <Button title="Messages" onPress={() => setLastAction("shared to Messages")} />
                <Button title="Mail" onPress={() => setLastAction("shared to Mail")} />
              </ConfirmationDialog>
            </Button>
          </HStack>
          <Text font="caption" foregroundStyle="secondary">Last action: {lastAction}</Text>
        </VStack>
      </ScrollView>

      <Sheet isPresented={sheetOpen} onDismiss={() => setSheetOpen(false)} detents={["medium", "large"]}>
        <ComposeSheet
          onCancel={() => setSheetOpen(false)}
          onSave={(title) => {
            setLastAction(`saved "${title}"`);
            setSheetOpen(false);
          }}
        />
      </Sheet>

      <Alert isPresented={alertOpen} onDismiss={() => setAlertOpen(false)} title="Delete everything?" message="This is a React-driven SwiftUI alert.">
        <Button title="Delete" role="destructive" onPress={() => setLastAction("deleted")} />
        <Button title="Cancel" role="cancel" onPress={() => setLastAction("cancelled")} />
      </Alert>

    </Screen>
  );
}

function ComposeSheet({ onCancel, onSave }: { onCancel: () => void; onSave: (title: string) => void }) {
  const [title, setTitle] = useState("");
  const [urgent, setUrgent] = useState(false);
  return (
    <VStack spacing={0}>
      <HStack padding={16}>
        <Button title="Cancel" onPress={onCancel} />
        <Spacer />
        <Text font="headline">New note</Text>
        <Spacer />
        <Button title="Save" buttonStyle="borderedProminent" disabled={!title} onPress={() => onSave(title + (urgent ? " (urgent)" : ""))} />
      </HStack>
      <Form>
        <Section header="Details">
          <TextField placeholder="Title" value={title} onChange={setTitle} />
          <Toggle label="Urgent" value={urgent} onChange={setUrgent} />
        </Section>
      </Form>
    </VStack>
  );
}
