import { useState } from "preact/hooks";
import { useDynamoConnector } from "../DynamoConnector.ts";
import { StatusBlock } from "../components/StatusBlock.tsx";
import { FolderGraphInfo } from "../service/dynamo.ts";
import { LocalFileList } from "./LocalFileList.tsx";
import { LocalScript } from "./LocalScript";

export function LocalApp() {
  const { state, reconnect, dynamo } = useDynamoConnector();
  const [script, setScript] = useState<FolderGraphInfo | undefined>(undefined);

  if (state.connectionState === "CONNECTED") {
    return (
      <div style={{ padding: "0 2px", height: "100%" }}>
        {!script && <LocalFileList dynamo={dynamo} setScript={setScript} />}
        {script && (
          <LocalScript
            env={"local"}
            setEnv={() => {}}
            services={{
              local: { connected: state.connectionState === "CONNECTED", reconnect, state, dynamo },
            }}
            script={script}
            setScript={setScript}
          />
        )}
      </div>
    );
  }
  return (
    <>
      <StatusBlock connectionState={state.connectionState} />
    </>
  );
}
