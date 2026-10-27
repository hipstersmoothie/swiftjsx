import { VStack, Text, Image, Button, ProgressView, type Color } from "swiftjsx";

export function Loading({ tint }: { tint?: Color }) {
  return <ProgressView tint={tint} frame={{ maxWidth: "infinity", minHeight: 320 }} />;
}

export function ErrorView({ message, retry, color = "secondary" }: { message: string; retry(): void; color?: Color }) {
  return (
    <VStack spacing={12} padding={24} frame={{ maxWidth: "infinity", minHeight: 320 }}>
      <Image systemName="wifi.exclamationmark" font="largeTitle" foregroundStyle={color} />
      <Text textAlignment="center" foregroundStyle={color}>{message}</Text>
      <Button title="Try Again" buttonStyle="bordered" tint={color === "secondary" ? undefined : color} onPress={retry} />
    </VStack>
  );
}
