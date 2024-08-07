import { Forma } from "forma-embedded-view-sdk/auto";
import { useCallback, useEffect, useState } from "preact/hooks";
import { Edit } from "../../icons/Edit";
import { Download } from "../../assets/icons/Download";
import { JSONGraph } from "../../types/types";
import { DynamoState } from "../../DynamoConnector";
import { DynamoService } from "../../service/dynamo";
import { Delete } from "../../icons/Delete";

function download(graph: any) {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(graph))}`,
  );
  element.setAttribute("download", `${graph.Name}.dyn`);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

type SharedGraph = {
  key: string;
  graph: any;
  metadata: {
    sub: string;
    name: string;
  };
};

type SharedGraphState =
  | {
      type: "fetching";
    }
  | { type: "partial"; n: number }
  | {
      type: "error";
      error: string;
    }
  | {
      type: "success";
      graphs: SharedGraph[];
    };

export function SharedGraphs({
  setPage,

  setEnv,
  setGraph,
  dynamoLocal,
}: {
  setEnv: (env: "daas" | "local") => void;
  setGraph: (graph: JSONGraph) => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
  };
  setPage: (page: "default" | "setup" | "publish") => void;
}) {
  const [state, setState] = useState<SharedGraphState>({ type: "fetching" });

  useEffect(() => {
    (async () => {
      try {
        setState({ type: "fetching" });
        const all = await Forma.extensions.storage.listObjects();

        setState({ type: "partial", n: all.results.length });
        const graphs = await Promise.all(
          all.results.map(async (data) => {
            const object = await Forma.extensions.storage.getTextObject({ key: data.key });

            return {
              key: data.key,
              metadata: JSON.parse(decodeURIComponent(object?.metadata || "{}")),
              graph: JSON.parse(object?.data || "{}"),
            };
          }),
        );

        setState({ type: "success", graphs });
      } catch (e) {
        console.error(e);

        // @ts-ignore
        setState({ type: "error", error: e?.message ?? "Unknown error" });
      }
    })();
  }, []);

  const deleteGraph = useCallback(
    async (key: string) => {
      try {
        await Forma.extensions.storage.deleteObject({ key });
        setState((prev) =>
          prev.type === "success"
            ? { type: "success", graphs: prev.graphs.filter((graph) => graph.key !== key) }
            : prev,
        );
      } catch (e) {
        console.error(e);
      }
    },
    [setState],
  );

  return (
    <div style={{ borderBottom: "1px solid var(--divider-lightweight)", paddingBottom: "8px" }}>
      <h4>Graphs shared with Hub (currently only Project!)</h4>

      {state.type === "fetching" && <div>Loading...</div>}

      {state.type === "partial" && (
        <div>
          {Array(state.n)
            .fill(0)
            .map((_, i) => (
              <weave-skeleton-item height="28px" width="100vw" key={i} />
            ))}
        </div>
      )}

      {state.type === "success" && state.graphs.length === 0 && (
        <div>No graphs are shared within your Hub. </div>
      )}

      {state.type === "error" && <div>Failed to fetch shared graphs.</div>}
      {state.type === "success" &&
        state.graphs.map((graph: SharedGraph) => (
          <div
            key={graph.key}
            style={{
              padding: "4px 8px 4px 8px",
              margin: "1px",
              backgroundColor: "var(--divider-lightweight)",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <div style={{ height: "24px", alignContent: "center" }}>{graph.graph.Name}</div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <div
                style={{
                  cursor: "pointer",
                  height: "24px",
                  width: "24px",
                  justifyContent: "center",
                  alignContent: "center",
                }}
                onClick={() => deleteGraph(graph.key)}
              >
                <Delete />
              </div>
              {dynamoLocal.state.connectionState === "CONNECTED" && (
                <div
                  style={{
                    cursor: "pointer",
                    height: "24px",
                    width: "24px",
                    justifyContent: "center",
                    alignContent: "center",
                  }}
                  onClick={() => {
                    setEnv("local");
                    setGraph({
                      id: "1",
                      name: graph.graph.Name,
                      type: "JSON",
                      graph: graph.graph,
                    });
                  }}
                >
                  <Edit />
                </div>
              )}
              <div
                style={{
                  cursor: "pointer",
                  height: "24px",
                  width: "24px",
                  justifyContent: "center",
                  alignContent: "center",
                }}
                onClick={() => download(graph.key)}
              >
                <Download />
              </div>
              <div>
                <weave-button
                  onClick={() =>
                    setGraph({
                      id: "1",
                      name: graph.graph.Name,
                      type: "JSON",
                      graph: graph.graph,
                    })
                  }
                >
                  Open
                </weave-button>
              </div>
            </div>
          </div>
        ))}

      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
        <div style={{ height: "24px", alignContent: "center" }}>Share graph within in my Hub</div>
        <weave-button onClick={() => setPage("publish")}>Publish graph</weave-button>
      </div>
    </div>
  );
}
