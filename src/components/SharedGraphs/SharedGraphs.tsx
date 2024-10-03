import { Forma } from "forma-embedded-view-sdk/auto";
import { useCallback, useEffect, useState } from "preact/hooks";
import { Edit } from "../../icons/Edit";
import { Download } from "../../assets/icons/Download";
import { JSONGraph } from "../../types/types";
import { DynamoState } from "../../DynamoConnector";
import { DynamoService } from "../../service/dynamo";
import { Delete } from "../../icons/Delete";
import { captureException } from "../../util/sentry";
import { Arrow } from "../../icons/Arrow";
import { ErrorBanner } from "../Errors.tsx/ErrorBanner";
import styles from "./SharedGraphs.module.pcss";

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
    publisher: {
      sub: string;
      name: string;
    };
  };
};

type SharedGraphState =
  | {
      type: "fetching";
    }
  | {
      type: "no-access";
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

function Item({
  graph,
  deleteGraph,
  setEnv,
  setGraph,
  dynamoLocal,
  isHubEditor,
}: {
  graph: SharedGraph;
  deleteGraph: (key: string) => void;
  setEnv: (env: "daas" | "local") => void;
  setGraph: (graph: JSONGraph) => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
  };
  isHubEditor: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className={styles.ItemContainer} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.ItemHeader}>
          <div className={styles.ArrowContainer}>
            <Arrow />
          </div>
          <div className={styles.GraphName}>{graph.graph.Name}</div>
        </div>
        <div className={styles.ItemActions}>
          {isHubEditor && (
            <div
              className={styles.DeleteIcon}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Are you sure you want to delete this graph?")) {
                  deleteGraph(graph.key);
                }
              }}
            >
              <Delete />
            </div>
          )}
          {dynamoLocal.state.connectionState === "CONNECTED" && (
            <div
              className={styles.EditIcon}
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
          <div className={styles.DownloadIcon} onClick={() => download(graph.graph)}>
            <Download />
          </div>
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
      {isExpanded && (
        <div className={styles.GraphDetails}>
          <div className={styles.GraphDescription}>{graph.graph.Description}</div>
          <div className={styles.GraphAuthor}>
            <b>Author:</b> {graph.graph.Author}
          </div>
          <div className={styles.GraphPublisher}>
            <b>Publisher:</b> {graph.metadata.publisher.name}
          </div>
        </div>
      )}
    </>
  );
}

export function SharedGraphs({
  setPage,
  setEnv,
  setGraph,
  dynamoLocal,
  isHubEditor,
}: {
  setEnv: (env: "daas" | "local") => void;
  setGraph: (graph: JSONGraph) => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
  };
  setPage: (
    page: { name: "default" } | { name: "setup" } | { name: "publish"; initialValue?: any },
  ) => void;
  isHubEditor: boolean;
}) {
  const [state, setState] = useState<SharedGraphState>({ type: "fetching" });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        setState({ type: "fetching" });
        const hasHubAccess = await Forma.getCanViewHub();
        if (!hasHubAccess) {
          setState({ type: "no-access" });
          return;
        }
        const project = await Forma.project.get();
        const all = await Forma.extensions.storage.listObjects({ authcontext: project.hubId });

        setState({ type: "partial", n: all.results.length });
        const graphs = await Promise.all(
          all.results.map(async (data) => {
            const object = await Forma.extensions.storage.getTextObject({
              key: data.key,
              authcontext: project.hubId,
            });
            return {
              key: data.key,
              metadata: JSON.parse(decodeURIComponent(object?.metadata || "{}")),
              graph: JSON.parse(object?.data || "{}"),
            };
          }),
        );

        setState({ type: "success", graphs });
      } catch (e) {
        captureException(e, "Error fetching shared graphs");

        // @ts-ignore
        setState({ type: "error", error: e?.message ?? "Unknown error" });
      }
    })();
  }, []);

  const deleteGraph = useCallback(
    async (key: string) => {
      try {
        const project = await Forma.project.get();
        await Forma.extensions.storage.deleteObject({ key, authcontext: project.hubId });
        setState((prev) =>
          prev.type === "success"
            ? { type: "success", graphs: prev.graphs.filter((graph) => graph.key !== key) }
            : prev,
        );
      } catch (e) {
        captureException(e, "Error deleting graph");
        setError("Failed to delete graph");
      }
    },
    [setState],
  );

  useEffect(() => {
    if (error) {
      setTimeout(() => setError(null), 3000);
    }
  }, [error]);

  if (state.type === "no-access") {
    return null;
  }

  return (
    <div className={styles.GraphContainer}>
      <h4 className={styles.Header}>Graphs shared in my hub</h4>

      {error && <ErrorBanner message={error} />}

      {state.type === "fetching" && <weave-skeleton-item className={styles.SkeletonItem} />}

      {state.type === "partial" && (
        <>
          {Array(state.n)
            .fill(0)
            .map((_, i) => (
              <weave-skeleton-item className={styles.SkeletonItem} key={i} />
            ))}
        </>
      )}

      {state.type === "success" && state.graphs.length === 0 && (
        <div className={styles.NoGraphs}>No graphs are shared in your hub</div>
      )}

      {state.type === "error" && (
        <div className={styles.ErrorMessage}>Failed to fetch shared graphs</div>
      )}

      {state.type === "success" &&
        state.graphs.map((graph: SharedGraph) => (
          <Item
            key={graph.key}
            graph={graph}
            deleteGraph={deleteGraph}
            setEnv={setEnv}
            setGraph={setGraph}
            dynamoLocal={dynamoLocal}
            isHubEditor={isHubEditor}
          />
        ))}

      <div className={styles.Footer}>
        <div className={styles.FooterText}>Share graph in this hub</div>
        <weave-button onClick={() => setPage({ name: "publish" })}>Share graph</weave-button>
      </div>
    </div>
  );
}
