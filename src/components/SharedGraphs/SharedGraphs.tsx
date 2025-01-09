import { Forma } from "forma-embedded-view-sdk/auto";
import { useCallback, useEffect, useState } from "preact/hooks";
import { JSONGraph } from "../../types/types";
import { DynamoState } from "../../DynamoConnector";
import { DynamoService } from "../../service/dynamo";
import { captureException } from "../../util/sentry";
import { ErrorBanner } from "../Errors.tsx/ErrorBanner";
import styles from "./SharedGraphs.module.pcss";
import GraphItem from "../GraphItem/GraphItem";
import { AppPageState, ShareDestination } from "../../pages/DaasApp";

export function download(graph: any) {
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

export function SharedGraphs({
  env,
  setEnv,
  setGraph,
  dynamoLocal,
  isEditor,
  shareDestination,
  setPage,
}: {
  env: "daas" | "local";
  setEnv: (env: "daas" | "local") => void;
  setGraph: (graph: JSONGraph) => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
  };
  isEditor: boolean;
  shareDestination: ShareDestination;
  setPage: (page: AppPageState) => void;
}) {
  const [state, setState] = useState<SharedGraphState>({ type: "fetching" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setState({ type: "fetching" });
        const hasViewAccess = shareDestination === "project" ? true : await Forma.getCanViewHub();
        if (!hasViewAccess) {
          setState({ type: "no-access" });
          return;
        }
        const project = await Forma.project.get();
        const all = await Forma.extensions.storage.listObjects({
          authcontext: shareDestination === "project" ? Forma.getProjectId() : project.hubId,
        });

        setState({ type: "partial", n: all.results.length });
        const graphs = await Promise.all(
          all.results.map(async (data) => {
            const object = await Forma.extensions.storage.getTextObject({
              key: data.key,
              authcontext: shareDestination === "project" ? Forma.getProjectId() : project.hubId,
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
  }, [shareDestination]);

  const deleteGraph = useCallback(
    async (key: string) => {
      try {
        const project = await Forma.project.get();
        await Forma.extensions.storage.deleteObject({
          key,
          authcontext: shareDestination === "project" ? Forma.getProjectId() : project.hubId,
        });
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
    [setState, shareDestination],
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
      <h4 className={styles.Header}>Graphs shared in my {shareDestination}</h4>

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
        <div className={styles.NoGraphs}>No graphs are shared in your {shareDestination}</div>
      )}

      {state.type === "error" && (
        <div className={styles.ErrorMessage}>Failed to fetch shared graphs</div>
      )}

      {state.type === "success" &&
        state.graphs.map((graph: SharedGraph) => (
          <GraphItem
            name={graph.graph.Name}
            key={graph.key}
            graph={graph}
            env={env}
            onRemove={
              isEditor
                ? () => {
                    if (window.confirm("Are you sure you want to delete this graph?")) {
                      deleteGraph(graph.key);
                    }
                  }
                : undefined
            }
            onDownload={() => download(graph.graph)}
            onOpen={
              env === "daas"
                ? () =>
                    setGraph({ id: "1", name: graph.graph.Name, type: "JSON", graph: graph.graph })
                : undefined
            }
            onEdit={
              dynamoLocal.state.connectionState === "CONNECTED"
                ? () => {
                    setEnv("local");
                    setGraph({
                      id: "1",
                      name: graph.graph.Name,
                      type: "JSON",
                      graph: graph.graph,
                    });
                  }
                : undefined
            }
          />
        ))}
      {isEditor && (
        <div className={styles.Footer}>
          <div className={styles.FooterText}>Share graph in this {shareDestination}</div>
          <weave-button
            onClick={() => setPage({ name: "publish", initialShareDestination: shareDestination })}
          >
            Share graph
          </weave-button>
        </div>
      )}
    </div>
  );
}
