import { HStack, VStack, Text, Image } from "swiftjsx";
import { canPlayAudio } from "./audio";

/** Shown when there's no native backend: the app works, but silently. */
export function NativeNotice({ compact }: { compact?: boolean }) {
  if (canPlayAudio()) return null;
  return (
    <HStack alignment="top" spacing={10} padding={12} background="orange/15" cornerRadius={12} accessibilityElement="combine" accessibilityIdentifier="native-off">
      <Image systemName="speaker.slash.fill" foregroundStyle="orange" />
      <VStack alignment="leading" spacing={2}>
        <Text font="subheadline" fontWeight="semibold">Sound is off</Text>
        {compact ? null : (
          <Text font="footnote" foregroundStyle="secondary">
            This runtime has no native backend, so AVPlayer isn’t available. Playback is simulated: progress, the queue and controls all work, without audio.
          </Text>
        )}
      </VStack>
    </HStack>
  );
}
