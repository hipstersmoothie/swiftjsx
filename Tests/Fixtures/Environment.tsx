import { render, Text, useEnvironment } from "swiftjsx";

function App() {
  const env = useEnvironment();
  return <Text>{`${env.horizontalSizeClass} ${env.colorScheme} ${env.dynamicTypeSize}`}</Text>;
}

render(<App />);
