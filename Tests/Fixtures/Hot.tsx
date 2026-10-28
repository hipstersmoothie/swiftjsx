import { render, Text, hot } from "swiftjsx";

// Counts bundle runs in hot.data (kept), and disposals (run before each update).
hot.data.runs = (hot.data.runs ?? 0) + 1;
hot.dispose(() => {
  hot.data.disposed = (hot.data.disposed ?? 0) + 1;
});

render(<Text>{`runs ${hot.data.runs} disposed ${hot.data.disposed ?? 0}`}</Text>);
