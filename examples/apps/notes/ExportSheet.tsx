// Export: Markdown or plain text, copied, shared (the share sheet), or sent
// straight to Mail or Messages.
import { useState } from "react";
import {
  openURL, toast, format as fmt, Navigator, Screen, ToolbarItem, Form, Section, Picker, Text, Button, Label, Sheet, ShareLink,
} from "swiftjsx";
import { toMarkdown, toPlainText } from "./markdown";

type Format = "markdown" | "plain";

export function ExportSheet({ isPresented, onDismiss, title, body }: { isPresented: boolean; onDismiss(): void; title: string; body: string }) {
  return (
    <Sheet isPresented={isPresented} onDismiss={onDismiss} detents={["medium", "large"]}>
      <Navigator>
        <ExportForm title={title} body={body} onDone={onDismiss} />
      </Navigator>
    </Sheet>
  );
}

function ExportForm({ title, body, onDone }: { title: string; body: string; onDone(): void }) {
  const [format, setFormat] = useState<Format>("markdown");
  const text = format === "markdown" ? toMarkdown(title, body) : toPlainText(title, body);
  const bytes = new TextEncoder().encode(text).length;
  const subject = title.trim() || "Note";

  const copy = () =>
    navigator.clipboard.writeText(text).then(() => toast("Copied", { systemImage: "checkmark", haptic: "success" }));

  return (
    <Screen title="Export" titleDisplayMode="inline">
      <ToolbarItem placement="confirmationAction">
        <Button title="Done" fontWeight="semibold" onPress={onDone} />
      </ToolbarItem>
      <Form>
        <Section>
          <Picker
            label="Format"
            pickerStyle="segmented"
            value={format}
            options={[{ value: "markdown", label: "Markdown" }, { value: "plain", label: "Plain Text" }]}
            onChange={(f) => setFormat(f as Format)}
          />
        </Section>
        <Section header="Preview" footer={fmt.bytes(bytes)}>
          <Text font="callout" fontDesign={format === "markdown" ? "monospaced" : undefined} lineLimit={14} accessibilityIdentifier="export-preview">
            {text || " "}
          </Text>
        </Section>
        <Section>
          <Button onPress={copy} accessibilityIdentifier="export-copy">
            <Label title="Copy" systemImage="doc.on.doc" />
          </Button>
          <ShareLink text={text} subject={subject} accessibilityIdentifier="export-share">
            <Label title="Share…" systemImage="square.and.arrow.up" />
          </ShareLink>
          <Button onPress={() => openURL(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`)}>
            <Label title="Mail" systemImage="envelope" />
          </Button>
          <Button onPress={() => openURL(`sms:&body=${encodeURIComponent(text)}`)}>
            <Label title="Messages" systemImage="message" />
          </Button>
        </Section>
      </Form>
    </Screen>
  );
}
