// The profile editor: a sheet with Cancel / Save, live validation (zod, URL),
// an async username check, and a "discard changes?" confirmation.
import { useState, type ReactNode } from "react";
import {
  withAnimation, Navigator, Screen, ToolbarItem, Form, Section, VStack, HStack, Text, Image, TextField, Picker, DatePicker, Button,
  ProgressView, Spacer, Sheet, ConfirmationDialog,
} from "swiftjsx";
import { saveProfile, useAccent, useColorScheme, useSettings, type Profile } from "./store";
import {
  BIO_LIMIT, birthdayRange, describeBirthday, formatBirthday, formatPhone, normalizeProfile, parseBirthday, parseWebsite,
  profilesEqual, pronounOptions, useUsernameStatus, validateProfile, type UsernameStatus,
} from "./profile";
import { ProfileAvatar, ToggleRow } from "./ui";

/** A fresh draft of the saved profile each time it opens. */
export function ProfileEditorSheet({ isPresented, onClose }: { isPresented: boolean; onClose(): void }) {
  const scheme = useColorScheme();
  return (
    <Sheet isPresented={isPresented} onDismiss={onClose}>
      {/* The sheet gets its own stack (title + toolbar), and the theme again. */}
      <Navigator colorScheme={scheme}>
        <ProfileEditor onClose={onClose} />
      </Navigator>
    </Sheet>
  );
}

function ProfileEditor({ onClose }: { onClose(): void }) {
  const saved = useSettings((s) => s.profile);
  const accent = useAccent();
  const [draft, setDraft] = useState<Profile>(saved);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const dirty = !profilesEqual(draft, saved);
  const errors = validateProfile(draft);
  const username = useUsernameStatus(draft.username, saved.username);
  const usernameOK = username.state === "unchanged" || username.state === "available";
  const valid = Object.keys(errors).length === 0 && usernameOK;
  const canSave = dirty && valid;
  // Errors show once a field has been edited, not for untouched fields.
  const errorFor = (key: keyof Profile) => (draft[key] !== saved[key] ? errors[key] : undefined);

  const save = () => {
    if (!canSave) return;
    saveProfile(normalizeProfile(draft));
    onClose();
  };
  const cancel = () => (dirty ? setConfirmingDiscard(true) : onClose());

  const birthday = parseBirthday(draft.birthday);
  const website = parseWebsite(draft.website);

  return (
    <Screen title="Edit Profile" titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={cancel} tint={accent.color} accessibilityIdentifier="cancel-button">
          <ConfirmationDialog
            isPresented={confirmingDiscard}
            onDismiss={() => setConfirmingDiscard(false)}
            title="Discard your changes?"
            message="Your edits to this profile haven’t been saved."
          >
            <Button title="Discard Changes" role="destructive" onPress={onClose} />
            <Button title="Keep Editing" role="cancel" onPress={() => {}} />
          </ConfirmationDialog>
        </Button>
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        <Button
          title="Save"
          fontWeight="semibold"
          tint={accent.color}
          disabled={!canSave}
          onPress={save}
          accessibilityIdentifier="save-button"
          accessibilityHint={canSave ? undefined : dirty ? "Fix the highlighted fields first" : "No changes to save"}
        />
      </ToolbarItem>

      <Form>
        <Section>
          <VStack spacing={8} padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }} accessibilityElement="combine">
            <ProfileAvatar name={draft.name} size={88} />
            <Text font="title2" fontWeight="bold" lineLimit={1}>{draft.name.trim() || "Your Name"}</Text>
            <Text font="subheadline" foregroundStyle="secondaryLabel">
              @{draft.username || "username"}
            </Text>
          </VStack>
        </Section>

        <Section header="Account" footer="Your username is public. You can change it once every 14 days.">
          <Field label="Name" error={errorFor("name")}>
            <TextField
              value={draft.name}
              onChange={(name) => set("name", name)}
              placeholder="Full name"
              accessibilityLabel="Name"
              accessibilityIdentifier="name-field"
            />
          </Field>
          <Field label="Username" error={username.state === "invalid" || username.state === "taken" ? username.message : undefined}>
            <HStack spacing={8}>
              <Text foregroundStyle="secondaryLabel">@</Text>
              <TextField
                value={draft.username}
                // Usernames are lowercase without spaces: masked as you type.
                onChange={(name) => set("username", name.toLowerCase().replace(/\s+/g, ""))}
                placeholder="username"
                accessibilityLabel="Username"
                accessibilityIdentifier="username-field"
              />
              <UsernameBadge status={username} />
            </HStack>
          </Field>
          {username.state === "taken" && username.suggestions.length ? (
            <HStack spacing={8}>
              <Text font="footnote" foregroundStyle="secondaryLabel">Try</Text>
              {username.suggestions.map((s) => (
                <Button key={s} buttonStyle="bordered" tint={accent.color} font="footnote" onPress={() => set("username", s)}>
                  <Text>@{s}</Text>
                </Button>
              ))}
            </HStack>
          ) : null}
        </Section>

        <Section header="Contact">
          <Field label="Email" error={errorFor("email")}>
            <TextField value={draft.email} onChange={(email) => set("email", email.replace(/\s+/g, ""))} placeholder="name@example.com" accessibilityLabel="Email" />
          </Field>
          <Field label="Phone" error={errorFor("phone")}>
            <TextField value={draft.phone} onChange={(phone) => set("phone", formatPhone(phone))} placeholder="(555) 555-0100" accessibilityLabel="Phone" />
          </Field>
          <Field label="Website" error={errorFor("website")}>
            <TextField value={draft.website} onChange={(url) => set("website", url)} placeholder="example.com" accessibilityLabel="Website" />
          </Field>
          {website && !errorFor("website") && draft.website !== saved.website ? (
            <HStack spacing={6}>
              <Image systemName="link" font="footnote" foregroundStyle="secondaryLabel" />
              <Text font="footnote" foregroundStyle="secondaryLabel" lineLimit={1}>Links to {website.host}{website.pathname === "/" ? "" : website.pathname}</Text>
            </HStack>
          ) : null}
        </Section>

        <Section header="About You" footer={`${BIO_LIMIT - draft.bio.length} characters left.`}>
          <Field label="Bio" error={errorFor("bio")}>
            <TextField
              value={draft.bio}
              // Hard limit: extra keystrokes are dropped.
              onChange={(bio) => set("bio", bio.slice(0, BIO_LIMIT))}
              placeholder="A line about yourself"
              accessibilityLabel="Bio"
            />
          </Field>
          <Picker
            label="Pronouns"
            pickerStyle="menu"
            tint={accent.color}
            value={draft.pronouns}
            options={pronounOptions}
            onChange={(pronouns) => set("pronouns", pronouns)}
          />
          {draft.pronouns === "custom" ? (
            <Field label="Custom" error={errors.customPronouns && draft.customPronouns ? errors.customPronouns : undefined}>
              <TextField value={draft.customPronouns} onChange={(p) => set("customPronouns", p)} placeholder="e.g. xe/xem" accessibilityLabel="Custom pronouns" />
            </Field>
          ) : null}
        </Section>

        <Section footer={describeBirthday(draft.birthday) ?? "Add your birthday to get a little something on the day."}>
          <ToggleRow
            title="Birthday"
            value={birthday !== null}
            onChange={(on) => withAnimation("snappy", () => set("birthday", on ? saved.birthday || "1995-01-01" : ""))}
          />
          {birthday ? (
            <DatePicker
              label="Born"
              value={birthday}
              onChange={(date) => set("birthday", formatBirthday(date))}
              {...birthdayRange()}
              tint={accent.color}
            />
          ) : null}
          {errorFor("birthday") ? <ErrorText message={errorFor("birthday")!} /> : null}
        </Section>

        {dirty ? (
          <Section>
            <Button title="Revert Changes" tint="red" onPress={() => withAnimation("snappy", () => setDraft(saved))} />
          </Section>
        ) : null}
      </Form>
    </Screen>
  );
}

/** "Label  [field]" with an error line under it. */
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <VStack alignment="leading" spacing={6} animation="snappy">
      <HStack spacing={12}>
        <Text frame={{ width: 84, alignment: "leading" }} foregroundStyle={error ? "red" : "label"}>{label}</Text>
        {children}
      </HStack>
      {error ? <ErrorText message={error} /> : null}
    </VStack>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <HStack spacing={4} transition="opacity" accessibilityElement="combine">
      <Image systemName="exclamationmark.circle.fill" font="footnote" foregroundStyle="red" />
      <Text font="footnote" foregroundStyle="red">{message}</Text>
      <Spacer />
    </HStack>
  );
}

function UsernameBadge({ status }: { status: UsernameStatus }) {
  switch (status.state) {
    case "checking":
      return <ProgressView frame={{ width: 20, height: 20 }} scale={0.8} accessibilityLabel="Checking availability" />;
    case "available":
      return <Image systemName="checkmark.circle.fill" foregroundStyle="green" transition="scale" accessibilityLabel="Available" />;
    case "taken":
    case "invalid":
      return <Image systemName="xmark.circle.fill" foregroundStyle="red" transition="scale" accessibilityLabel={status.message} />;
    default:
      return null;
  }
}
