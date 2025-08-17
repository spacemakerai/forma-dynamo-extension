import { useEffect, useState } from "preact/hooks";
import allGraphs from "../../assets/graphs";
import { DynamoState } from "../../DynamoConnector";
import { DynamoService } from "../../service/dynamo";
import { JSONGraph } from "../../types/types";
import GraphItem from "../GraphItem/GraphItem";

function download(jsonGraph: JSONGraph) {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(jsonGraph.graph))}`,
  );
  element.setAttribute("download", `${jsonGraph.name}.dyn`);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

const type = "JSON" as const;

function useSampleGraphs(): JSONGraph[] {
  const [graphs, setGraphs] = useState<JSONGraph[]>([]);

  useEffect(() => {
    Promise.all(
      Object.entries(allGraphs).map(([name, fn]) => {
        return fn().then((graph: any) => ({
          id: name,
          type,
          name: name.substring(2, name.length - 4),
          graph: graph.default,
        }));
      }),
    ).then(setGraphs);
  }, []);

  return graphs;
}

export function PublicGraphs({
  env,
  setEnv,
  setGraph,
  dynamoLocal,
}: {
  env: "daas" | "local";
  setEnv: (env: "daas" | "local") => void;
  setGraph: (graph: JSONGraph) => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
  };
}) {
  const graphs = useSampleGraphs();

  return (
    <>
      <h4>Graphs provided by Autodesk</h4>
      {graphs.map((script) => {
        return (
          <GraphItem
            name={script.name}
            key={script.id}
            graph={script}
            env={env}
            onEdit={
              dynamoLocal.state.connectionState === "CONNECTED"
                ? () => {
                    setEnv("local");
                    setGraph(script);
                  }
                : undefined
            }
            onDownload={() => download(script)}
            onOpen={env === "daas" ? () => setGraph(script) : undefined}
          />
        );
      })}
    </>
  );
}
