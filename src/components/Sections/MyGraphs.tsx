import { useCallback, useEffect, useState } from "preact/hooks";
import { Import } from "../../assets/icons/Import";
import { JSONGraph } from "../../types/types";
import { Delete } from "../../icons/Delete";
import { File } from "../../icons/File";
import Logo from "../../assets/Logo.png";
import { DynamoState } from "../../DynamoConnector";
import { DynamoService, FolderGraphInfo, GraphInfo } from "../../service/dynamo";

function storeGraphs(graphs: any[]) {
  localStorage.setItem("dynamo-graphs", JSON.stringify(graphs));

  return graphs;
}

export function useLocalOpenGraph(
  state: DynamoState,
  dynamoService: DynamoService & { current: () => Promise<GraphInfo> },
) {
  const [suggestOpenGraph, setSuggestOpenGraph] = useState<GraphInfo | null>(null);

  useEffect(() => {
    function handler() {
      if (state.connectionState === "CONNECTED") {
        dynamoService
          .current()
          .then((currentGraph) => {
            if (currentGraph && currentGraph.id) {
              setSuggestOpenGraph(currentGraph);
            }
          })
          .catch((e: Error) => {
            console.error(e);
          });
      }
    }

    const interval = setInterval(handler, 1000);
    handler();

    return () => clearInterval(interval);
  }, [dynamoService, state.connectionState]);

  return suggestOpenGraph;
}

export function MyGraphs({
  setGraph,
  dragging,
  setDragging,
  dynamoLocal,
}: {
  setGraph: (v: FolderGraphInfo | JSONGraph) => void;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
  };
}) {
  const graphs = () => {
    try {
      return JSON.parse(localStorage.getItem("dynamo-graphs") || "[]");
    } catch (e) {
      return [];
    }
  };

  const localOpenGraph = useLocalOpenGraph(
    dynamoLocal.state,
    dynamoLocal.dynamo as DynamoService & { current: () => Promise<GraphInfo> },
  );

  const [dropped, setDropped] = useState<any[]>(graphs);

  const addDropped = useCallback(
    (graph: any) => {
      setDropped((prev) => {
        if (!prev) {
          return storeGraphs([graph]);
        }

        return storeGraphs([...prev, graph]);
      });
    },
    [setDropped],
  );

  const removeDropped = useCallback(
    (index: number) => {
      setDropped((prev) => {
        if (!prev) {
          return storeGraphs(prev);
        }
        return storeGraphs(prev.filter((_, i) => i !== index));
      });
    },
    [setDropped],
  );

  // TODO: we don't need to handle multiple files
  const onDrop = useCallback<JSX.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer?.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...(event.dataTransfer?.items || [])].forEach((item) => {
          // If dropped items aren't files, reject them
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              file.text().then((text) => {
                const graph = JSON.parse(text);
                addDropped(graph);
              });
            }
          }
        });
      } else {
        // Use DataTransfer interface to access the file(s)
        [...(event.dataTransfer?.files || [])].forEach((file) => {
          file.text().then((text) => {
            const graph = JSON.parse(text);
            addDropped(graph);
          });
        });
      }
    },
    [addDropped, setDragging],
  );

  const openDroppedGraph = useCallback(
    (graph: any) => {
      setGraph({
        id: "2",
        type: "JSON",
        name: graph.Name,
        graph,
      });
    },
    [setGraph],
  );

  const onClickDropZone = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dyn";
    input.onchange = async () => {
      try {
        if (!input.files) return;
        const [file] = Array.from(input.files);
        const graph = JSON.parse(await file.text());

        setDropped(graph);
      } catch (e) {
        console.error(e);
      }
    };
    input.click();
  }, []);

  return (
    <>
      <h4>My own graph</h4>
      <div
        id="dropzone"
        style={{ zIndex: 2, cursor: "pointer", position: "relative" }}
        onClick={onClickDropZone}
      >
        <div
          style={{
            display: "flex",
            backgroundColor: dragging ? "#0696D730" : "white",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60px",
            border: dragging ? "1px dashed #0696D780" : "1px dashed var(--border-base)",
            borderRadius: "4px",
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDragEnd={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={onDrop}
        >
          <Import />
          <b>Drag & Drop</b>
          Files to import (.dyn)
        </div>
      </div>
      {dragging && (
        <div
          onClick={() => setDragging(false)}
          style={{
            zIndex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backdropFilter: "blur(1px)",
          }}
        />
      )}

      {localOpenGraph && (
        <div
          style={{
            margin: "8px 4px 8px 4px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "colum" }}>
            <img style={{ margin: "4px 4px 4px 0" }} src={Logo} />
            <div style={{ height: "24px", alignContent: "center" }}>
              {localOpenGraph.name || "Untitled"}.dyn
            </div>
          </div>

          <weave-button
            onClick={() => {
              setGraph({
                type: "FolderGraph",
                id: localOpenGraph.id,
                name: localOpenGraph.name || "Untitled",
                metadata: localOpenGraph.metadata,
              });
            }}
          >
            Open current local graph
          </weave-button>
        </div>
      )}

      {!!dropped?.length &&
        dropped?.map((graph, i) => (
          <div
            key={graph.Id}
            style={{
              margin: "8px 4px 8px 4px",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "colum" }}>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  margin: "4px 4px 4px 0",
                  backgroundColor: "#3C3C3C",
                  borderRadius: "4px",
                  justifyContent: "center",
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <File />
              </div>
              <div style={{ height: "24px", alignContent: "center" }}>{graph.Name}.dyn</div>
            </div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <div
                style={{
                  cursor: "pointer",
                  margin: "3px",
                }}
                onClick={() => removeDropped(i)}
              >
                <Delete />
              </div>
              <weave-button variant="solid" onClick={() => openDroppedGraph(graph)}>
                Open
              </weave-button>
            </div>
          </div>
        ))}
    </>
  );
}
