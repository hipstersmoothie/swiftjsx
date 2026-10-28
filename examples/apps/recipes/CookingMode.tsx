// Hands-free cooking: full screen, one step per page (a paging horizontal
// ScrollView), big type, the screen kept awake, each step read aloud with
// the spoken word highlighted, and timers for the durations in a step.
// Running timers dock to the bottom with <SafeAreaInset>.
//
// Native pieces (all optional): UIApplication.idleTimerDisabled, AVSpeechSynthesizer,
// UNUserNotificationCenter. Without them the pages, timers and checklist all
// still work; a notice says what's missing.
import { useEffect, useRef, useState } from "react";
import {
  VStack, HStack, ZStack, Text, Image, Button, ScrollView, Spacer, Capsule, Circle, Menu, Label, Section, Sheet,
  SafeAreaInset, Flow, haptic, type HostInstance,
} from "swiftjsx";
import { thumbSize, type Recipe } from "./api";
import { findDurations, formatDuration, type Duration } from "./steps";
import { scaleMeasure, ingredientKey } from "./quantity";
import { useServings, BASE_SERVINGS, useIsFavorite, useRecipes } from "./store";
import { useTimers } from "./timers";
import { useKeepAwake } from "./native/keepAwake";
import { speak, stopSpeaking, useSpeech } from "./native/speech";
import { capabilities } from "./native/platform";
import { TimerBar } from "./TimerBar";
import { IngredientList } from "./Ingredients";
import { TimerButton } from "./TimerButton";
import { ACCENT, NativeNotice } from "./ui";

const QUICK_TIMERS = [1, 3, 5, 10, 15, 20, 30, 45, 60];

export function CookingMode({ recipe, open, onClose, checked, onToggleIngredient }: {
  recipe: Recipe;
  /** Whether the sheet is actually presented (React renders its content either way). */
  open: boolean;
  onClose(): void;
  checked: ReadonlySet<number>;
  onToggleIngredient(i: number): void;
}) {
  const steps = recipe.steps;
  const pageCount = steps.length + 1; // + the "Enjoy" page
  const [page, setPage] = useState(0);
  const [handsFree, setHandsFree] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const scroller = useRef<HostInstance>(null);
  const pageRefs = useRef<(HostInstance | null)[]>([]);
  const servings = useServings(recipe.id);
  const factor = servings / BASE_SERVINGS;
  const startTimer = useTimers((s) => s.start);
  const speech = useSpeech();
  const awake = useKeepAwake(open);

  // Closing (or leaving) cooking mode stops reading.
  useEffect(() => {
    if (!open) void stopSpeaking();
    return () => {
      void stopSpeaking();
    };
  }, [open]);

  // Hands-free: read each step as it comes up. `page` changes halfway through
  // a swipe, so wait for the page to settle before starting.
  useEffect(() => {
    if (!open || !handsFree) return;
    const timer = setTimeout(() => {
      if (page < steps.length) void speak(stepKey(recipe.id, page), steps[page]);
      else void speak("done", `That's it. Enjoy your ${recipe.name}!`);
    }, 450);
    return () => clearTimeout(timer);
  }, [open, handsFree, page, recipe.id, recipe.name, steps]);

  const changePage = (next: number) => {
    const clamped = Math.max(0, Math.min(pageCount - 1, next));
    if (clamped === page) return;
    setPage(clamped);
    // Moving on stops reading the old step (hands-free starts the new one).
    if (!handsFree && speech.key?.startsWith(`${recipe.id}:`)) void stopSpeaking();
  };

  const goTo = (index: number) => {
    const target = pageRefs.current[Math.max(0, Math.min(pageCount - 1, index))];
    if (target) scroller.current?.scrollTo(target, { anchor: "leading" });
    changePage(index);
    haptic("selection");
  };

  const currentKey = stepKey(recipe.id, page);
  const reading = speech.key === currentKey;
  const toggleReading = () => {
    if (reading) void stopSpeaking();
    else if (page < steps.length) void speak(currentKey, steps[page]);
  };

  const missing = [
    awake ? null : "The screen may dim (keeping it awake needs UIApplication).",
    speech.available ? null : "Steps can't be read aloud (needs AVSpeechSynthesizer).",
    capabilities.notifications ? null : "Timers only ring while the app is open (no notifications).",
  ].filter((m): m is string => m != null);

  return (
    <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background="black" colorScheme="dark" tint={ACCENT}>
      <Header
        recipe={recipe}
        page={page}
        pageCount={pageCount}
        handsFree={handsFree}
        onToggleHandsFree={() => {
          if (handsFree) void stopSpeaking();
          setHandsFree((h) => !h);
        }}
        speechAvailable={speech.available}
        onClose={onClose}
        onIngredients={() => setShowIngredients(true)}
        onQuickTimer={(minutes) => startTimer("Timer", minutes * 60, recipe.name)}
      />
      {missing.length ? (
        <VStack padding={{ horizontal: 16, bottom: 8 }}>
          <NativeNotice items={missing} dark />
        </VStack>
      ) : null}
      <ScrollView
        ref={scroller}
        axis="horizontal"
        paging
        spacing={0}
        showsIndicators={false}
        frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        onScroll={(e) => {
          // There's no "page changed" event: derive it from the offset.
          if (e.width > 0) changePage(Math.round(e.x / e.width));
        }}
      >
        {steps.map((step, i) => (
          <StepPage
            key={i}
            pageRef={(r) => {
              pageRefs.current[i] = r;
            }}
            recipe={recipe}
            index={i}
            step={step}
            factor={factor}
            spoken={speech.key === stepKey(recipe.id, i) ? speech.range : null}
            reading={speech.key === stepKey(recipe.id, i)}
            onTimer={(label, seconds) => startTimer(label, seconds, recipe.name)}
          />
        ))}
        <DonePage
          pageRef={(r) => {
            pageRefs.current[steps.length] = r;
          }}
          recipe={recipe}
          onClose={onClose}
        />
      </ScrollView>
      <SafeAreaInset edge="bottom" spacing={0}>
        <VStack spacing={0} background="#1c1c1e">
          <TimerBar dark />
          <Controls
            page={page}
            pageCount={pageCount}
            reading={reading}
            canRead={speech.available && page < steps.length}
            onPrevious={() => goTo(page - 1)}
            onNext={() => goTo(page + 1)}
            onToggleReading={toggleReading}
          />
        </VStack>
      </SafeAreaInset>
      <Sheet isPresented={showIngredients} onDismiss={() => setShowIngredients(false)} detents={["medium", "large"]} dragIndicator="visible">
        <ScrollView colorScheme="dark">
          <VStack alignment="leading" spacing={12} padding={20}>
            <HStack>
              <Text font="title2" fontWeight="bold">Ingredients</Text>
              <Spacer />
              <Text foregroundStyle="secondary" monospacedDigit>{checked.size}/{recipe.ingredients.length}</Text>
            </HStack>
            <Text font="footnote" foregroundStyle="secondary">For {servings} {servings === 1 ? "serving" : "servings"}</Text>
            <IngredientList ingredients={recipe.ingredients} factor={factor} checked={checked} onToggle={onToggleIngredient} large />
          </VStack>
        </ScrollView>
      </Sheet>
    </VStack>
  );
}

const stepKey = (recipeId: string, index: number) => `${recipeId}:${index}`;

function Header({ recipe, page, pageCount, handsFree, onToggleHandsFree, speechAvailable, onClose, onIngredients, onQuickTimer }: {
  recipe: Recipe;
  page: number;
  pageCount: number;
  handsFree: boolean;
  onToggleHandsFree(): void;
  speechAvailable: boolean;
  onClose(): void;
  onIngredients(): void;
  onQuickTimer(minutes: number): void;
}) {
  const isDone = page >= pageCount - 1;
  return (
    <VStack spacing={12} padding={{ horizontal: 16, top: 8, bottom: 12 }}>
      <HStack spacing={12}>
        <RoundButton systemImage="xmark" label="Close cooking mode" onPress={onClose} identifier="close-cooking" />
        <VStack spacing={1} frame={{ maxWidth: "infinity" }}>
          <Text font="caption" fontWeight="semibold" foregroundStyle="secondary" lineLimit={1}>{recipe.name}</Text>
          <Text font="headline" monospacedDigit contentTransition="numericText" animation="snappy">
            {isDone ? "Finished" : `Step ${page + 1} of ${pageCount - 1}`}
          </Text>
        </VStack>
        <RoundButton systemImage="list.bullet" label="Ingredients" onPress={onIngredients} identifier="cooking-ingredients" />
        <Menu systemImage="timer" accessibilityLabel="New timer" accessibilityIdentifier="quick-timer">
          <Section header="New Timer">
            {QUICK_TIMERS.map((m) => (
              <Button key={m} onPress={() => onQuickTimer(m)}>
                <Label title={formatDuration(m * 60)} systemImage="timer" />
              </Button>
            ))}
          </Section>
        </Menu>
        {speechAvailable ? (
          <RoundButton
            systemImage={handsFree ? "ear.fill" : "ear"}
            label={handsFree ? "Stop reading steps automatically" : "Read each step aloud automatically"}
            onPress={onToggleHandsFree}
            active={handsFree}
            identifier="hands-free"
          />
        ) : null}
      </HStack>
      <HStack spacing={4} accessibilityHidden>
        {Array.from({ length: pageCount - 1 }, (_, i) => (
          <Capsule key={i} fill={i <= page ? ACCENT : "white/20"} frame={{ maxWidth: "infinity", height: 4 }} animation="smooth" />
        ))}
      </HStack>
    </VStack>
  );
}

function RoundButton({ systemImage, label, onPress, active, identifier }: {
  systemImage: string;
  label: string;
  onPress(): void;
  active?: boolean;
  identifier?: string;
}) {
  return (
    <Button buttonStyle="plain" pressedScale={0.9} onPress={onPress} accessibilityLabel={label} accessibilityIdentifier={identifier}>
      <Image
        systemName={systemImage}
        font="headline"
        foregroundStyle={active ? "black" : "white"}
        frame={{ width: 40, height: 40 }}
        background={active ? ACCENT : "white/15"}
        cornerRadius="capsule"
      />
    </Button>
  );
}

function StepPage({ pageRef, recipe, index, step, factor, spoken, reading, onTimer }: {
  pageRef(r: HostInstance | null): void;
  recipe: Recipe;
  index: number;
  step: string;
  factor: number;
  spoken: { location: number; length: number } | null;
  reading: boolean;
  onTimer(label: string, seconds: number): void;
}) {
  const durations = findDurations(step);
  // Ingredients this step mentions, with their (scaled) amounts.
  const lower = step.toLowerCase();
  const used = recipe.ingredients.filter((ing) => {
    const key = ingredientKey(ing.name);
    return key.length > 2 && lower.includes(key);
  });

  return (
    <VStack ref={pageRef} relativeWidth={1} spacing={0} accessibilityIdentifier="step-page" accessibilityElement="contain">
      <ScrollView showsIndicators={false} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <VStack alignment="leading" spacing={24} padding={{ horizontal: 24, top: 12, bottom: 24 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          <Text font="subheadline" fontWeight="bold" foregroundStyle={ACCENT} kerning={1.2} textCase="uppercase">
            Step {index + 1}
          </Text>
          <StepText text={step} durations={durations} spoken={spoken} reading={reading} />
          {durations.length ? (
            <Flow spacing={10} lineSpacing={10}>
              {durations.map((d) => (
                <TimerButton key={d.start} label={d.label} display={d.display} seconds={d.seconds} onStart={onTimer} large />
              ))}
            </Flow>
          ) : null}
          {used.length ? (
            <VStack alignment="leading" spacing={8} padding={14} background="white/8" cornerRadius={14} frame={{ maxWidth: "infinity", alignment: "leading" }}>
              <Text font="caption" fontWeight="semibold" foregroundStyle="secondary" textCase="uppercase">In this step</Text>
              {used.map((ing) => (
                <HStack key={ing.name} spacing={8} alignment="firstTextBaseline">
                  <Text font="title3" fontWeight="semibold" foregroundStyle={ACCENT}>{scaleMeasure(ing.measure, factor) || "·"}</Text>
                  <Text font="title3">{ing.name}</Text>
                </HStack>
              ))}
            </VStack>
          ) : null}
        </VStack>
      </ScrollView>
    </VStack>
  );
}

/**
 * The step in big type. Durations are bold and underlined; while it's being
 * read, words already spoken are bright, the current word is orange, and the
 * rest is dimmed (karaoke style, so nothing reflows as the highlight moves).
 */
function StepText({ text, durations, spoken, reading }: {
  text: string;
  durations: Duration[];
  spoken: { location: number; length: number } | null;
  reading: boolean;
}) {
  const cuts = new Set<number>([0, text.length]);
  for (const d of durations) {
    cuts.add(d.start);
    cuts.add(d.end);
  }
  const word = spoken ? { start: spoken.location, end: spoken.location + spoken.length } : null;
  if (word) {
    cuts.add(Math.min(text.length, word.start));
    cuts.add(Math.min(text.length, word.end));
  }
  const points = [...cuts].sort((a, b) => a - b);
  const runs: { start: number; end: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) if (points[i + 1] > points[i]) runs.push({ start: points[i], end: points[i + 1] });

  return (
    <Text font="title" fontWeight="medium" lineSpacing={8} accessibilityLabel={text}>
      {runs.map((run) => {
        const inDuration = durations.some((d) => run.start >= d.start && run.end <= d.end);
        const isWord = word != null && run.start >= word.start && run.end <= word.end;
        const color = isWord ? ACCENT : reading && word && run.start >= word.end ? "white/45" : "white";
        return (
          <Text key={run.start} foregroundStyle={color} fontWeight={inDuration ? "bold" : undefined} underline={inDuration ? ACCENT : undefined}>
            {text.slice(run.start, run.end)}
          </Text>
        );
      })}
    </Text>
  );
}

function DonePage({ pageRef, recipe, onClose }: { pageRef(r: HostInstance | null): void; recipe: Recipe; onClose(): void }) {
  const favorite = useIsFavorite(recipe.id);
  const toggleFavorite = useRecipes((s) => s.toggleFavorite);
  return (
    <VStack ref={pageRef} relativeWidth={1} spacing={20} padding={32} accessibilityIdentifier="done-page" accessibilityElement="contain">
      <Spacer />
      <ZStack alignment="bottomTrailing">
        <Image src={thumbSize(recipe.thumb, "medium")} contentMode="fill" frame={{ width: 180, height: 180 }} cornerRadius="capsule" />
        <Image systemName="checkmark.circle.fill" font={{ size: 44 }} foregroundStyle="green" background="black" cornerRadius="capsule" />
      </ZStack>
      <Text font={{ size: 34, weight: "bold", design: "serif" }} textAlignment="center">Enjoy!</Text>
      <Text font="title3" foregroundStyle="secondary" textAlignment="center">{recipe.name} is ready.</Text>
      <HStack spacing={12}>
        <Button buttonStyle="bordered" tint="pink" onPress={() => toggleFavorite(recipe)}>
          <Label title={favorite ? "Favorited" : "Favorite"} systemImage={favorite ? "heart.fill" : "heart"} padding={{ vertical: 4 }} />
        </Button>
        <Button buttonStyle="borderedProminent" onPress={onClose} accessibilityIdentifier="finish-cooking">
          <Label title="Done" systemImage="checkmark" padding={{ vertical: 4 }} />
        </Button>
      </HStack>
      <Spacer />
    </VStack>
  );
}

function Controls({ page, pageCount, reading, canRead, onPrevious, onNext, onToggleReading }: {
  page: number;
  pageCount: number;
  reading: boolean;
  canRead: boolean;
  onPrevious(): void;
  onNext(): void;
  onToggleReading(): void;
}) {
  return (
    <HStack spacing={16} padding={{ horizontal: 24, top: 10, bottom: 8 }}>
      <Button buttonStyle="plain" pressedScale={0.9} onPress={onPrevious} disabled={page === 0} accessibilityLabel="Previous step" accessibilityIdentifier="previous-step">
        <Image systemName="chevron.left" font="title2" fontWeight="semibold" foregroundStyle="white" frame={{ width: 56, height: 56 }} background="white/12" cornerRadius="capsule" opacity={page === 0 ? 0.35 : 1} />
      </Button>
      <Spacer />
      <Button
        buttonStyle="plain"
        pressedScale={0.92}
        onPress={onToggleReading}
        disabled={!canRead}
        accessibilityLabel={reading ? "Stop reading" : "Read this step aloud"}
        accessibilityIdentifier="read-aloud"
      >
        <ZStack frame={{ width: 72, height: 72 }} opacity={canRead ? 1 : 0.35}>
          <Circle fill={reading ? "white" : ACCENT} />
          <Image
            systemName={reading ? "stop.fill" : "speaker.wave.2.fill"}
            font="title2"
            foregroundStyle={reading ? "black" : "white"}
            symbolEffect={{ type: "variableColor", active: reading }}
          />
        </ZStack>
      </Button>
      <Spacer />
      <Button buttonStyle="plain" pressedScale={0.9} onPress={onNext} disabled={page >= pageCount - 1} accessibilityLabel="Next step" accessibilityIdentifier="next-step">
        <Image systemName="chevron.right" font="title2" fontWeight="semibold" foregroundStyle="white" frame={{ width: 56, height: 56 }} background="white/12" cornerRadius="capsule" opacity={page >= pageCount - 1 ? 0.35 : 1} />
      </Button>
    </HStack>
  );
}
