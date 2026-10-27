// Export: Markdown or plain text, shared through whatever exists. SwiftJSX has
// no ShareLink, so the share sheet needs the native backend; mail and
// messages work everywhere through openURL.
import { useState } from "react";
import {
  openURL, Navigator, Screen, ToolbarItem, Form, Section, Picker, Text, Button, Label, Sheet,
} from "swiftjsx";
import { toMarkdown, toPlainText } from "./markdown";
import { formatBytes } from "./format";
import { hasUIKit, shareText } from "./share";

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
  const [copied, setCopied] = useState(false);
  const text = format === "markdown" ? toMarkdown(title, body) : toPlainText(title, body);
  const bytes = new TextEncoder().encode(text).length;
  const subject = title.trim() || "Note";
  const native = hasUIKit();

  const copy = () =>
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });

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
        <Section header="Preview" footer={formatBytes(bytes)}>
          <Text font="callout" fontDesign={format === "markdown" ? "monospaced" : undefined} lineLimit={14} accessibilityIdentifier="export-preview">
            {text || " "}
          </Text>
        </Section>
        <Section
          footer={
            native
              ? undefined
              : "The share sheet needs the native backend (UIActivityViewController). Mail and Messages get the note as a URL-encoded body; very long notes may be cut off."
          }
        >
          <Button onPress={copy} accessibilityIdentifier="export-copy">
            <Label title={copied ? "Copied" : "Copy"} systemImage={copied ? "checkmark" : "doc.on.doc"} />
          </Button>
          {native ? (
            <Button onPress={() => void shareText(text)} accessibilityIdentifier="export-share">
              <Label title="Share…" systemImage="square.and.arrow.up" />
            </Button>
          ) : null}
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
