import { render, Text, useEnvironment } from "swiftjsx";

function App() {
  const env = useEnvironment();
  return (
    <Text>{`${env.horizontalSizeClass} ${env.colorScheme} ${env.dynamicTypeSize} ${env.window.width}x${env.window.height} ${env.safeAreaInsets.top} ${env.locale.region} ${env.locale.weekStartsOn} ${env.locale.hourCycle}`}</Text>
  );
}

render(<App />);
