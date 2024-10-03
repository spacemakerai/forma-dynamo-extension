import { useCallback, useEffect, useState } from "preact/hooks";
import { JSONGraph } from "../../types/types";
import { Delete } from "../../icons/Delete";
import Logo from "../../assets/Logo.png";
import { DynamoState } from "../../DynamoConnector";
import { DynamoService, FolderGraphInfo, GraphInfo } from "../../service/dynamo";
import { filterForSize } from "../../utils/filterGraph";
import { DropZone } from "../DropZone";
import { captureException } from "../../util/sentry";
import { Share } from "../../icons/Share";
import styles from "./MyGraphs.module.pcss";

const FILE_TYPES = [".dyn"];

type DynamoGraph = {
  Name: string;
  Description: string;
  Author: string;
  Thumbnail: string;
  [key: string]: any;
};

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
  setEnv,
  setGraph,
  dynamoLocal,
  setPage,
  isHubEditor,
}: {
  setEnv: (v: "daas" | "local") => void;
  setGraph: (v: FolderGraphInfo | JSONGraph) => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
  };
  setPage: (
    v: { name: "default" } | { name: "setup" } | { name: "publish"; initialValue?: any },
  ) => void;
  isHubEditor: boolean;
}) {
  const graphs = () => {
    try {
      return JSON.parse(localStorage.getItem("dynamo-graphs") || "[]");
    } catch (e) {
      captureException(e, "Error parsing local graphs");
      return [];
    }
  };

  const localOpenGraph = useLocalOpenGraph(
    dynamoLocal.state,
    dynamoLocal.dynamo as DynamoService & { current: () => Promise<GraphInfo> },
  );

  // const localOpenGraph: GraphInfo = {
  //   id: "example-graph-id",
  //   name: "Example Graph",
  //   metadata: {
  //     author: "John Doe",
  //     description: "This is an example graph.",
  //     thumbnail: "example-thumbnail-url",
  //     customProperties: {},
  //     dynamoVersion: "2.0",
  //   },
  //   dependencies: [],
  //   inputs: [],
  //   issues: [],
  //   outputs: [],
  //   status: "",
  // };

  const [dropped, setDropped] = useState<any[]>(graphs);

  const addDropped = useCallback(
    (graph: DynamoGraph) => {
      const filtered = filterForSize(graph);

      setDropped((prev) => {
        if (!prev) {
          return storeGraphs([filtered]);
        }
        return storeGraphs([...prev, filtered]);
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

  const Graph = useCallback(
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

  return (
    <div className={styles.MyGraphsContainer}>
      <div className={styles.Header}>Upload graph</div>
      <DropZone
        parse={async (file: File) => JSON.parse(await file.text())}
        filetypes={FILE_TYPES}
        onFileDropped={addDropped}
      />

      <div className={styles.Header}>My graphs</div>
      <div className={styles.GraphsList}>
        {localOpenGraph && (
          <div className={styles.GraphContainer}>
            <div className={styles.GraphInfo}>
              <img className={styles.GraphIcon} src={Logo} />
              <div className={styles.GraphName}>{localOpenGraph.name || "Untitled"}.dyn</div>
            </div>
            <div className={styles.GraphActions}>
              <weave-button
                onClick={() => {
                  setEnv("local");
                  setGraph({
                    type: "FolderGraph",
                    id: localOpenGraph.id,
                    name: localOpenGraph.name || "Untitled",
                    metadata: localOpenGraph.metadata,
                  });
                }}
              >
                Open
              </weave-button>
            </div>
          </div>
        )}

        {!!dropped?.length &&
          dropped?.map((graph, i) => (
            <div key={graph.Id} className={styles.GraphContainer}>
              <div className={styles.GraphInfo}>
                <img className={styles.GraphIcon} src={Logo} />
                <div className={styles.GraphName}>{graph.Name}.dyn</div>
              </div>
              <div className={styles.GraphActions}>
                <div
                  className={styles.DeleteGraph}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this graph?")) {
                      removeDropped(i);
                    }
                  }}
                >
                  <Delete />
                </div>
                {isHubEditor && (
                  <div
                    className={styles.ShareGraph}
                    onClick={() => setPage({ name: "publish", initialValue: graph })}
                  >
                    <Share />
                  </div>
                )}
                <weave-button variant="solid" density="high" onClick={() => Graph(graph)}>
                  Open
                </weave-button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
