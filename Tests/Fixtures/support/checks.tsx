// A tiny test harness for fixtures: runs checks in JS and renders the results
// as "PASS name" / "FAIL name: message" Text nodes, after a "N of M" summary,
// for the Swift side to read (see Tests/SwiftJSXTests/Support.swift).

import { useEffect, useState, type ReactElement } from "react";
import { render, VStack, Text } from "swiftjsx";

/** Plain checks: throw or reject to fail. */
export type Checks = Record<string, () => unknown>;
/** Checks that need to render: call `pass()` once the expected state shows up. */
export type ComponentChecks = Record<string, (report: { pass(): void; fail(error: unknown): void }) => ReactElement>;

export function eq(actual: unknown, expected: unknown) {
  if (actual !== expected) throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

export async function rejects(promise: Promise<unknown>, name: string) {
  try {
    await promise;
  } catch (error: any) {
    if (error?.name !== name) throw new Error(`expected ${name}, got ${error?.name}: ${error?.message}`);
    return;
  }
  throw new Error(`expected a ${name} rejection`);
}

export function runChecks(checks: Checks, components: ComponentChecks = {}) {
  const total = Object.keys(checks).length + Object.keys(components).length;

  function App() {
    const [results, setResults] = useState<Record<string, string>>({});
    const report = (name: string, result: string) => setResults((r) => (name in r ? r : { ...r, [name]: result }));
    const pass = (name: string) => report(name, `PASS ${name}`);
    const fail = (name: string, error: any) => report(name, `FAIL ${name}: ${error?.message ?? error}`);

    useEffect(() => {
      for (const [name, check] of Object.entries(checks)) {
        Promise.resolve().then(check).then(() => pass(name), (error) => fail(name, error));
      }
    }, []);

    return (
      <VStack>
        <Text>{`${Object.keys(results).length} of ${total}`}</Text>
        {Object.values(results).map((r) => (
          <Text key={r}>{r}</Text>
        ))}
        {Object.entries(components).map(([name, check]) => (
          <Guard key={name} name={name} fail={fail}>
            {check({ pass: () => pass(name), fail: (e) => fail(name, e) })}
          </Guard>
        ))}
      </VStack>
    );
  }

  render(<App />);
}

import { Component, type ReactNode } from "react";
class Guard extends Component<{ name: string; fail(name: string, error: unknown): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.fail(this.props.name, error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
