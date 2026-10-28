import { useState, type ReactElement } from "react";
import { render, Navigator, useNavigation, Screen, List, Section, Button, HStack, VStack, Text, Image, Sheet } from "swiftjsx";
import { HackerNewsApp } from "./apps/hacker-news/App";
import { TodosApp } from "./apps/todos/App";
import { WeatherApp } from "./apps/weather/App";
import { PokedexApp } from "./apps/pokedex/App";
import { ChatApp } from "./apps/chat/App";
import { FlashcardsApp } from "./apps/flashcards/App";
import { SettingsApp } from "./apps/settings/App";
import { CalculatorApp } from "./apps/calculator/App";
import { KanbanApp } from "./apps/kanban/App";
import { FitnessApp } from "./apps/fitness/App";
import { MusicApp } from "./apps/music/App";
import { NotesApp } from "./apps/notes/App";
import { ShopApp } from "./apps/shop/App";
import { Game2048App } from "./apps/game2048/App";
import { HabitsApp } from "./apps/habits/App";
import { RecipesApp } from "./apps/recipes/App";
import { SocialApp } from "./apps/social/App";
import { BlueskyApp } from "./apps/bluesky/App";
import { HooksDemo } from "./screens/Hooks";
import { NavigationDemo } from "./screens/Navigation";
import { VirtualListDemo } from "./screens/VirtualListDemo";
import { RefsDemo } from "./screens/Refs";
import { GridDemo } from "./screens/Grid";
import { NativeDemo } from "./screens/NativeDemo";
import { TabsDemo } from "./screens/Tabs";
import { SplitViewDemo } from "./screens/SplitView";
import { GesturesDemo } from "./screens/Gestures";
import { ImagesDemo } from "./screens/Images";
import { StylesDemo } from "./screens/Styles";
import { ControlsDemo } from "./screens/Controls";
import { ChartsDemo } from "./screens/Charts";
import { CanvasDemo } from "./screens/CanvasDemo";
import { AnimationDemo } from "./screens/Animation";
import { MediaDemo } from "./screens/Media";

type Demo = { title: string; subtitle: string; icon: string; color: any; screen: () => ReactElement };

const demos: Demo[] = [
  { title: "Hooks", subtitle: "useState, useReducer, useEffect, custom hooks", icon: "atom", color: "blue", screen: () => <HooksDemo /> },
  { title: "Navigation & sheets", subtitle: "push/pop, toolbar, sheet, alert, dialog", icon: "rectangle.stack", color: "purple", screen: () => <NavigationDemo depth={1} /> },
  { title: "Virtual list", subtitle: "100,000 rows, ~30 rendered", icon: "list.bullet.rectangle", color: "orange", screen: () => <VirtualListDemo /> },
  { title: "Refs", subtitle: "focus(), scrollTo(), measure()", icon: "scope", color: "pink", screen: () => <RefsDemo /> },
  { title: "Lazy grid", subtitle: "LazyVGrid with adaptive columns", icon: "square.grid.3x3", color: "green", screen: () => <GridDemo /> },
  { title: "Tabs", subtitle: "TabView, badges, a page-style pager", icon: "square.split.bottomrightquarter", color: "teal", screen: () => <TabsDemo /> },
  { title: "Split view", subtitle: "NavigationSplitView: columns on iPad, a stack on iPhone", icon: "sidebar.left", color: "mint", screen: () => <SplitViewDemo /> },
  { title: "Gestures", subtitle: "drag, pinch, rotate, long press, double tap", icon: "hand.draw", color: "red", screen: () => <GesturesDemo /> },
  { title: "Shapes, colors & fonts", subtitle: "Circle, Capsule, gradients, system colors, styled text", icon: "paintpalette", color: "pink", screen: () => <StylesDemo /> },
  { title: "Controls & layout", subtitle: "Menus, pickers, text input, rows, Flow, Grid, overlays", icon: "slider.horizontal.3", color: "teal", screen: () => <ControlsDemo /> },
  { title: "Animation", subtitle: "AbsoluteStack, transitions, exit animations, completions", icon: "wand.and.stars", color: "purple", screen: () => <AnimationDemo /> },
  { title: "Media", subtitle: "Video, web views, maps", icon: "play.rectangle.on.rectangle", color: "red", screen: () => <MediaDemo /> },
  { title: "Charts", subtitle: "Swift Charts: bars, lines, areas, rules, scrubbing", icon: "chart.bar.xaxis", color: "pink", screen: () => <ChartsDemo /> },
  { title: "Canvas", subtitle: "Immediate-mode drawing from worklets: a pad, animated bars, a clock", icon: "scribble.variable", color: "indigo", screen: () => <CanvasDemo /> },
  { title: "Images", subtitle: "Remote images: cached, decoded off main", icon: "photo.on.rectangle", color: "cyan", screen: () => <ImagesDemo /> },
  { title: "Native", subtitle: "Objective-C APIs from JS, onMain()", icon: "cpu", color: "indigo", screen: () => <NativeDemo /> },
];

// Toy apps: whole apps (own tabs and navigation), shown in a sheet.
const apps: Demo[] = [
  { title: "Hacker News", subtitle: "fetch, TanStack Query, infinite lists, comments", icon: "newspaper", color: "orange", screen: () => <HackerNewsApp /> },
  { title: "Todos", subtitle: "zustand + localStorage, swipe actions, search", icon: "checklist", color: "blue", screen: () => <TodosApp /> },
  { title: "Weather", subtitle: "Open-Meteo, zod, gradients, materials", icon: "cloud.sun.fill", color: "cyan", screen: () => <WeatherApp /> },
  { title: "Chat", subtitle: "WebSocket echo bot, bubbles, offline queue", icon: "bubble.left.and.bubble.right.fill", color: "green", screen: () => <ChatApp /> },
  { title: "Flashcards", subtitle: "worklet swipe stack, spaced repetition", icon: "rectangle.stack.fill", color: "purple", screen: () => <FlashcardsApp /> },
  { title: "Settings", subtitle: "Forms, validation, pickers, appearance", icon: "gearshape.fill", color: "gray", screen: () => <SettingsApp /> },
  { title: "Calculator", subtitle: "Exact decimals, press feedback, scientific mode", icon: "plus.forwardslash.minus", color: "orange", screen: () => <CalculatorApp /> },
  { title: "Kanban", subtitle: "Drag and drop between columns", icon: "rectangle.split.3x1.fill", color: "indigo", screen: () => <KanbanApp /> },
  { title: "Fitness", subtitle: "Activity rings, charts, scrubbing", icon: "figure.run", color: "green", screen: () => <FitnessApp /> },
  { title: "Music", subtitle: "iTunes search, AVPlayer through native APIs", icon: "music.note", color: "pink", screen: () => <MusicApp /> },
  { title: "Notes", subtitle: "Markdown editing, split view, search", icon: "note.text", color: "yellow", screen: () => <NotesApp /> },
  { title: "Shop", subtitle: "Product grid, cart, validated checkout", icon: "bag.fill", color: "blue", screen: () => <ShopApp /> },
  { title: "2048", subtitle: "Swipe worklets, sliding tiles, undo", icon: "square.grid.4x3.fill", color: "orange", screen: () => <Game2048App /> },
  { title: "Bluesky", subtitle: "Public AppView: feeds, threads, profiles, search, image viewer", icon: "cloud.fill", color: "blue", screen: () => <BlueskyApp /> },
  { title: "Social", subtitle: "Feed, stories, comments, worklet hearts", icon: "heart.text.square.fill", color: "pink", screen: () => <SocialApp /> },
  { title: "Habits", subtitle: "Streaks, calendars, heatmaps, locale weeks", icon: "flame.fill", color: "orange", screen: () => <HabitsApp /> },
  { title: "Recipes", subtitle: "TheMealDB, cooking mode, timers, speech", icon: "fork.knife", color: "green", screen: () => <RecipesApp /> },
  { title: "Pokédex", subtitle: "PokeAPI, image grid, infinite loading", icon: "circle.grid.3x3.fill", color: "red", screen: () => <PokedexApp /> },
];

function Row({ demo, onPress }: { demo: Demo; onPress(): void }) {
  return (
    <Button buttonStyle="plain" onPress={onPress}>
      <HStack spacing={14} padding={{ vertical: 4 }}>
        <Image systemName={demo.icon} foregroundStyle="white" frame={{ width: 32, height: 32 }} background={demo.color} cornerRadius={8} />
        <VStack alignment="leading" spacing={2}>
          <Text font="headline">{demo.title}</Text>
          <Text font="caption" foregroundStyle="secondary">{demo.subtitle}</Text>
        </VStack>
      </HStack>
    </Button>
  );
}

function Home() {
  const nav = useNavigation();
  const [app, setApp] = useState<Demo | null>(null);
  return (
    <Screen title="SwiftJSX">
      <Sheet isPresented={app !== null} onDismiss={() => setApp(null)} detents={["large"]}>
        {app?.screen()}
      </Sheet>
      <List>
        <Section header="Apps" footer="Small complete apps built with SwiftJSX and npm packages. Swipe down to close.">
          {apps.map((demo) => (
            <Row key={demo.title} demo={demo} onPress={() => setApp(demo)} />
          ))}
        </Section>
        <Section header="Demos" footer="Edit examples/ with `npm run dev` running: changes apply instantly and keep state.">
          {demos.map((demo) => (
            <Row key={demo.title} demo={demo} onPress={() => nav.push(demo.screen())} />
          ))}
        </Section>
      </List>
    </Screen>
  );
}

render(
  <Navigator>
    <Home />
  </Navigator>,
);
