import { useCallback, useEffect, useState } from "preact/hooks";
import { DynamoService, FolderGraphInfo, GraphInfo } from "../service/dynamo";

export function CurrentOpenGraphPrompt({
  dynamo,
  setScript,
}: {
  dynamo: DynamoService & { current: () => Promise<GraphInfo> };
  setScript: (script: FolderGraphInfo) => void;
}) {
  const [suggestOpenGraph, setSuggestOpenGraph] = useState<GraphInfo | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  const currentFolder = localStorage.getItem("dynamo-folder");

  useEffect(() => {
    function handler() {
      dynamo
        .current()
        .then((currentGraph) => {
          if (currentGraph && currentGraph.id) {
            setSuggestOpenGraph(currentGraph);
            clearInterval(interval);
          }
        })
        .catch((e: Error) => {
          console.error(e);
        });
    }

    const interval = setInterval(handler, 1000);

    return () => clearInterval(interval);
  }, [dynamo]);

  const onOpenGraph = useCallback(() => {
    if (suggestOpenGraph) {
      setScript({ type: "FolderGraph", ...suggestOpenGraph });
      const file = suggestOpenGraph.id.replaceAll("\\\\", "\\");
      const folder = file.split("\\").slice(0, -1).join("\\");

      if (!currentFolder) {
        localStorage.setItem("dynamo-folder", folder);
      }
    }
  }, [setScript, suggestOpenGraph, currentFolder]);

  if (suggestOpenGraph && !isClosed) {
    return (
      <div
        style={{
          position: "fixed",
          width: "calc(100% - 74px)",
          margin: "10px",
          padding: "25px",
          ...(currentFolder ? { bottom: "20px" } : { top: "20px" }),
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "5px",
          textAlign: "center",
        }}
      >
        '{suggestOpenGraph.name}' is currently open in Dynamo.
        <br />
        <br />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <weave-button onClick={() => setIsClosed(true)}>Dismiss</weave-button>
          <weave-button variant="solid" onClick={onOpenGraph}>
            Open
          </weave-button>
        </div>
      </div>
    );
  }
  return null;
}
