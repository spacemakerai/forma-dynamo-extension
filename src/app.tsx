import { LocalScript } from "./pages/LocalScript";
import { useDynamoConnector } from "./DynamoConnector.ts";
import { StatusBlock } from "./components/StatusBlock.tsx";
import { LocalFileList } from "./pages/LocalFileList.tsx";
import { useState } from "preact/hooks";

export function App() {
  const { state, dynamoHandler } = useDynamoConnector();
  const [script, setScript] = useState(undefined);

  if (state.connectionState === "CONNECTED") {
    return (
      <div style={{ padding: "0 2px", height: "100%" }}>
        {!script && <LocalFileList dynamoHandler={dynamoHandler} setScript={setScript} />}
        {script && (
          <LocalScript dynamoHandler={dynamoHandler} script={script} setScript={setScript} />
        )}
      </div>
    );
  }
  return <StatusBlock connectionState={state.connectionState} />;
}
