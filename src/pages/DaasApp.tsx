import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import Dynamo from "../service/dynamo";
import sphereAreaGraph from "../assets/spherearea.json";
import { LocalScript } from "./LocalScript";
import { Forma } from "forma-embedded-view-sdk/auto";
import { DaasServerInfo } from "./DaaSServerInfo";

export type JSONGraph = {
  type: "JSON";
  id: string;
  name: string;
  graph?: any;
};

function useSampleGraphs(): JSONGraph[] {
  return [{ id: "1", type: "JSON", name: "Sphere Area", graph: sphereAreaGraph }];
}

const urls: Record<string, string> = {
  DEV: "https://0z63s658g5.execute-api.us-west-2.amazonaws.com",
  STG: "https://stg.service.dynamo.autodesk.com",
  PROD: "https://service.dynamo.autodesk.com",
};

export function DaasApp({ lucky }: { lucky: boolean }) {
  const [environment, setDynamoEnvironment] = useState<string>("STG");
  const [graph, setGraph] = useState<JSONGraph | undefined>(undefined);

  const sampleGraphs = useSampleGraphs();

  useEffect(() => {
    if (lucky) {
      setGraph(sampleGraphs[0]);
      setDynamoEnvironment("DEV");
    }
  }, [lucky, sampleGraphs]);

  const isProd = import.meta.env.MODE === "production";
  const callbackUrl = isProd
    ? `${window.location.origin}${window.location.pathname}`
    : `${window.location.origin}/`;
  Forma.auth.configure({
    clientId: import.meta.env.VITE_EXTENSION_CLIENT_ID,
    callbackUrl,
    scopes: ["data:read", "data:write"],
  });

  const daas = useMemo(() => {
    return new Dynamo(urls[environment] || urls["DEV"], async () => {
      const { accessToken } = await Forma.auth.acquireTokenOverlay();
      return `Bearer ${accessToken}`;
    });
  }, [environment]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // TODO: we don't need to handle multiple files
  const onDrop = useCallback<JSX.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      if (event.dataTransfer?.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...(event.dataTransfer?.items || [])].forEach((item) => {
          // If dropped items aren't files, reject them
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              file.text().then((t) => {
                if (textAreaRef.current) {
                  textAreaRef.current.value = t;
                }
              });
            }
          }
        });
      } else {
        // Use DataTransfer interface to access the file(s)
        [...(event.dataTransfer?.files || [])].forEach((file) => {
          file.text().then((t) => {
            if (textAreaRef.current) {
              textAreaRef.current.value = t;
            }
          });
        });
      }
    },
    [textAreaRef],
  );

  const onLoadTextAreaContentsAsGraph = useCallback(() => {
    if (!textAreaRef.current) {
      return;
    }

    const contents = textAreaRef.current.value;
    const graph: JSONGraph = {
      id: "2",
      type: "JSON",
      name: "Manually input graph",
      graph: JSON.parse(contents),
    };
    setGraph(graph);
  }, []);

  return (
    <div>
      <div>
        Environment:
        <weave-button
          variant={environment === "DEV" ? "solid" : undefined}
          onClick={() => setDynamoEnvironment("DEV")}
        >
          Dev
        </weave-button>
        <weave-button
          variant={environment === "STG" ? "solid" : undefined}
          onClick={() => setDynamoEnvironment("STG")}
        >
          Stg
        </weave-button>
        <weave-button
          variant={environment === "PROD" ? "solid" : undefined}
          onClick={() => setDynamoEnvironment("PROD")}
        >
          Prod
        </weave-button>
      </div>
      {!graph && (
        <>
          <h2>Upload a graph or load a sample graph:</h2>
          <div id="dropzone" style={{ display: "flex" }} onDrop={onDrop}>
            <textarea
              placeholder="Drag-n-drop or paste the contents of a .dyn file here"
              ref={textAreaRef}
              style={{ flex: 1, minHeight: "80px" }}
            />
          </div>
          <weave-button onClick={onLoadTextAreaContentsAsGraph}>Load</weave-button>
          <h4>Sample Graphs</h4>
          {sampleGraphs.map((script) => {
            return (
              <div key={script.id}>
                {script.name} <weave-button onClick={() => setGraph(script)}>Load</weave-button>
              </div>
            );
          })}
        </>
      )}
      {graph && <LocalScript script={graph} setScript={setGraph} dynamo={daas} autoRun={lucky} />}
      <DaasServerInfo dynamo={daas} />
    </div>
  );
}
