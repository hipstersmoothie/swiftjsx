import { VStack, Text, Image, Button, ProgressView } from "swiftjsx";

const fill = { maxWidth: "infinity", maxHeight: "infinity" } as const;

// ProgressView's `label` only shows on determinate bars, so spinners get a Text.
export function Loading({ label }: { label?: string }) {
  return (
    <VStack spacing={10} frame={fill}>
      <ProgressView />
      {label ? <Text font="footnote" foregroundStyle="secondary">{label}</Text> : null}
    </VStack>
  );
}

export function ErrorView({ message, retry }: { message: string; retry(): void }) {
  return (
    <VStack spacing={12} padding={24} frame={fill}>
      <Image systemName="wifi.exclamationmark" font="largeTitle" foregroundStyle="secondary" />
      <Text textAlignment="center" foregroundStyle="secondary">{message}</Text>
      <Button title="Try again" buttonStyle="bordered" onPress={retry} />
    </VStack>
  );
}

export function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <VStack spacing={8} padding={32} frame={fill}>
      <Image systemName={icon} font="largeTitle" foregroundStyle="secondary" />
      <Text font="headline">{title}</Text>
      <Text font="subheadline" textAlignment="center" foregroundStyle="secondary">{message}</Text>
    </VStack>
  );
}
