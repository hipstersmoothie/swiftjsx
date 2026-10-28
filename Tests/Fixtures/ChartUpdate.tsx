import { useState } from "react";
import { render, VStack, Button, Chart, BarMark } from "swiftjsx";

const days = [0, 1, 2].map((i) => ({ date: new Date(2026, 9, 14 + i), steps: 1000 * (i + 1) }));

function App() {
  const [selected, setSelected] = useState<number | null>(null);
  const day = selected === null ? null : days.reduce((a, b) => (Math.abs(+b.date - selected) < Math.abs(+a.date - selected) ? b : a));
  return (
    <VStack>
      <Chart onXSelectionChange={(x) => typeof x === "number" && setSelected(x)}>
        {days.map((d) => (
          <BarMark key={+d.date} x={d.date} xUnit="day" y={d.steps} foregroundStyle={day && +day.date === +d.date ? "orange" : "pink"} />
        ))}
      </Chart>
      <Button title="pick" onPress={() => setSelected(+days[1].date + 3600_000)} />
    </VStack>
  );
}

render(<App />);
