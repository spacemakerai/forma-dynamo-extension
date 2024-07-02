import { useCallback, useMemo, useRef, useState } from "preact/hooks";
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

const env = new URLSearchParams(window.location.search).get("ext:daas") || "dev";

const urls: Record<string, string> = {
  DEV: "https://dev.service.dynamo.autodesk.com",
  STG: "https://stg.service.dynamo.autodesk.com",
  PROD: "https://service.dynamo.autodesk.com",
};

export function DaasApp() {
  const [graph, setGraph] = useState<JSONGraph | undefined>(undefined);

  const sampleGraphs = useSampleGraphs();

  const daas = useMemo(() => {
    return new Dynamo(urls[String(env).toUpperCase()] || urls["DEV"], async () => {
      const { accessToken } = await Forma.auth.acquireTokenOverlay();
      return `Bearer ${accessToken}`;
    });
  }, []);

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
      {graph && <LocalScript script={graph} setScript={setGraph} dynamo={daas} />}
      <DaasServerInfo dynamo={daas} />
    </div>
  );
}
