import { useCallback, useEffect, useState } from "preact/hooks";
import { JSONGraph, UnSavedGraph } from "../../types/types";
import { DynamoState } from "../../DynamoConnector";
import { DynamoService, FolderGraphInfo, GraphInfo } from "../../service/dynamo";
import { filterForSize } from "../../utils/filterGraph";
import { DropZone } from "../DropZone";
import { captureException } from "../../util/sentry";
import styles from "./MyGraphs.module.pcss";
import GraphItem from "../GraphItem/GraphItem";

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

function isEmpty(value: any) {
  return value === null || value === undefined || value === "";
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
            if (currentGraph) {
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
  env,
  setGraph,
  dynamoLocal,
  setPage,
  isHubEditor,
}: {
  env: "daas" | "local";
  setGraph: (v: FolderGraphInfo | JSONGraph | UnSavedGraph) => void;
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
    <>
      {env === "local" && localOpenGraph && (
        <div className={styles.MyGraphsContainer}>
          <div className={styles.Header}>Connected graph</div>
          <div className={styles.GraphsList}>
            <GraphItem
              name={
                isEmpty(localOpenGraph.id) ? "Home" : `${localOpenGraph.name || "Untitled"}.dyn`
              }
              graph={localOpenGraph}
              onOpen={() => {
                if (isEmpty(localOpenGraph.id)) {
                  setGraph({ type: "UNSAVED", id: "2", name: "Home", graph: localOpenGraph });
                } else {
                  setGraph({
                    type: "FolderGraph",
                    id: localOpenGraph.id,
                    name: localOpenGraph.name || "Untitled",
                    metadata: localOpenGraph.metadata,
                  });
                }
              }}
            />
          </div>
        </div>
      )}

      <div className={styles.MyGraphsContainer}>
        <div className={styles.Header}>Upload graph</div>
        <DropZone
          parse={async (file: File) => JSON.parse(await file.text())}
          filetypes={FILE_TYPES}
          onFileDropped={addDropped}
        />
        <div className={styles.Header}>Uploaded graphs</div>
        <div className={styles.GraphsList}>
          {dropped?.length ? (
            dropped?.map((graph, i) => (
              <GraphItem
                name={`${graph.Name}.dyn`}
                key={graph.Id}
                onShare={
                  isHubEditor ? () => setPage({ name: "publish", initialValue: graph }) : undefined
                }
                graph={graph}
                onRemove={() => {
                  if (window.confirm("Are you sure you want to delete this graph?")) {
                    removeDropped(i);
                  }
                }}
                onOpen={() => Graph(graph)}
              />
            ))
          ) : (
            <div className={styles.NoGraphs}>No graphs have been uploaded yet</div>
          )}
        </div>
      </div>
    </>
  );
}
