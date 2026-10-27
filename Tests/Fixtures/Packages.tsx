// Popular npm packages, bundled into the app and run through real React.
import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { atom, useAtom, Provider as JotaiProvider } from "jotai";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import useSWR, { SWRConfig } from "swr";
import { z } from "zod";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { produce } from "immer";
import { nanoid } from "nanoid";
import axios from "axios";
import { Text } from "swiftjsx";
import { runChecks, eq, type Checks, type ComponentChecks } from "./support/checks";

// MARK: Plain checks

const checks: Checks = {
  zod() {
    const User = z.object({ name: z.string().min(1), age: z.number().int().positive(), email: z.email() });
    eq(User.safeParse({ name: "Ada", age: 36, email: "ada@example.com" }).success, true);
    const bad = User.safeParse({ name: "", age: -1, email: "nope" });
    eq(bad.success, false);
    eq(bad.error!.issues.length, 3);
  },
  "date-fns"() {
    const start = parseISO("2026-02-27");
    eq(format(addDays(start, 3), "yyyy-MM-dd"), "2026-03-02");
    eq(differenceInCalendarDays(parseISO("2026-12-25"), start), 301);
  },
  immer() {
    const state = { todos: [{ id: 1, done: false }], count: 1 };
    const next = produce(state, (draft) => {
      draft.todos[0].done = true;
      draft.count++;
    });
    eq(next.todos[0].done, true);
    eq(state.todos[0].done, false);
    eq(Object.isFrozen(next), true);
  },
  nanoid() {
    const ids = new Set(Array.from({ length: 100 }, () => nanoid()));
    eq(ids.size, 100);
    eq([...ids][0].length, 21);
  },
  async axios() {
    const response = await axios.get("https://mock.test/json", { params: { x: 1 } });
    eq(response.status, 200);
    eq(response.data.hello, "world");
    eq(response.data.query, "x=1");
    const posted = await axios.post("https://mock.test/echo", { a: 1 }, { headers: { "X-Custom": "abc" } });
    eq(posted.data.body, '{"a":1}');
    eq(posted.data.custom, "abc");
    let status = 0;
    await axios.get("https://mock.test/status/500").catch((error) => (status = error.response?.status));
    eq(status, 500);
  },
};

// MARK: Component checks

const useCounter = create<{ count: number; inc(): void }>((set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }));

const usePersisted = create<{ name: string; setName(n: string): void }>()(
  persist((set) => ({ name: "", setName: (name) => set({ name }) }), {
    name: "packages-fixture",
    storage: createJSONStorage(() => localStorage),
  }),
);

const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const components: ComponentChecks = {
  zustand: ({ pass }) => {
    function Counter() {
      const { count, inc } = useCounter();
      useEffect(() => {
        if (count < 3) inc();
        else pass();
      }, [count]);
      return <Text>zustand {count}</Text>;
    }
    return <Counter />;
  },
  "zustand persist (localStorage)": ({ pass, fail }) => {
    function Persisted() {
      const { name, setName } = usePersisted();
      useEffect(() => {
        if (!name) setName("Ada");
        else {
          try {
            eq(JSON.parse(localStorage.getItem("packages-fixture")!).state.name, "Ada");
            pass();
          } catch (e) {
            fail(e);
          }
        }
      }, [name]);
      return null;
    }
    return <Persisted />;
  },
  jotai: ({ pass }) => {
    function Counter() {
      const [count, setCount] = useAtom(countAtom);
      const [doubled] = useAtom(doubledAtom);
      useEffect(() => {
        if (count < 2) setCount((c) => c + 1);
        else if (doubled === 4) pass();
      }, [count, doubled]);
      return null;
    }
    return (
      <JotaiProvider>
        <Counter />
      </JotaiProvider>
    );
  },
  "@tanstack/react-query": ({ pass, fail }) => {
    function Data() {
      const query = useQuery({
        queryKey: ["json"],
        queryFn: async () => (await fetch("https://mock.test/json?from=query")).json(),
      });
      const mutation = useMutation({
        mutationFn: async (value: string) => (await fetch("https://mock.test/echo", { method: "POST", body: value })).json(),
      });
      useEffect(() => {
        if (query.isError) fail(query.error);
        if (query.data && mutation.isIdle) mutation.mutate("saved");
        if (mutation.data) {
          try {
            eq(query.data.query, "from=query");
            eq(mutation.data.body, "saved");
            pass();
          } catch (e) {
            fail(e);
          }
        }
      }, [query.status, mutation.status]);
      return null;
    }
    return (
      <QueryClientProvider client={queryClient}>
        <Data />
      </QueryClientProvider>
    );
  },
  swr: ({ pass, fail }) => {
    function Data() {
      const { data, error } = useSWR("https://mock.test/json?from=swr", (url: string) => fetch(url).then((r) => r.json()));
      useEffect(() => {
        if (error) fail(error);
        if (data) data.query === "from=swr" ? pass() : fail(new Error(`got ${JSON.stringify(data)}`));
      }, [data, error]);
      return null;
    }
    return (
      <SWRConfig value={{ provider: () => new Map() }}>
        <Data />
      </SWRConfig>
    );
  },
};

runChecks(checks, components);
