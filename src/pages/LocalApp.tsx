import { LocalScript } from "./LocalScript";
import { useDynamoConnector } from "../DynamoConnector.ts";
import { StatusBlock } from "../components/StatusBlock.tsx";
import { LocalFileList } from "./LocalFileList.tsx";
import { useState } from "preact/hooks";
import { FolderGraphInfo } from "../service/dynamo.ts";

export function LocalApp() {
  const { state, dynamo } = useDynamoConnector();
  const [script, setScript] = useState<FolderGraphInfo | undefined>(undefined);

  if (state.connectionState === "CONNECTED") {
    return (
      <div style={{ padding: "0 2px", height: "100%" }}>
        {!script && <LocalFileList dynamo={dynamo} setScript={setScript} />}
        {script && (
          <LocalScript dynamo={dynamo} script={script} setScript={setScript} autoRun={false} />
        )}
      </div>
    );
  }
  return <StatusBlock connectionState={state.connectionState} />;
}
