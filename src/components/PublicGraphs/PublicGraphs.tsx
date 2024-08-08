import { useState } from "preact/hooks";
import { Download } from "../../assets/icons/Download";
import sphereAreaGraph from "../../assets/spherearea.json";
import buildingEnvelopeGraph from "../../assets/workflows/WorkFlow_01BuildingEnvelope.json";
import buildingModification from "../../assets/workflows/WorkFlow_02BuildingModification.json";
import customAnalysisIsovist from "../../assets/workflows/WorkFlow_04CustomAnalysis_Isovist.json";
import customAnalysisTerrainSlope from "../../assets/workflows/WorkFlow_04CustomAnalysis_TerrainSlope.json";
import customAnalysisViewToObject from "../../assets/workflows/WorkFlow_04CustomAnalysis_ViewToObject.json";
import { DynamoState } from "../../DynamoConnector";
import { Edit } from "../../icons/Edit";
import { DynamoService } from "../../service/dynamo";
import { JSONGraph } from "../../types/types";
import { Arrow } from "../../icons/Arrow";

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

function useSampleGraphs(): JSONGraph[] {
  return [
    { id: "1", type: "JSON", name: "Sphere Area", graph: sphereAreaGraph },
    { id: "2", type: "JSON", name: "Workflow_01BuildingEnvelope", graph: buildingEnvelopeGraph },
    {
      id: "3",
      type: "JSON",
      name: "Workflow_02BuildingModification",
      graph: buildingModification,
    },
    {
      id: "4",
      type: "JSON",
      name: "Workflow_04CustomAnalysis_Isovist",
      graph: customAnalysisIsovist,
    },
    {
      id: "5",
      type: "JSON",
      name: "Workflow_04CustomAnalysis_TerrainSlope",
      graph: customAnalysisTerrainSlope,
    },
    {
      id: "6",
      type: "JSON",
      name: "Workflow_04CustomAnalysis_ViewToObject",
      graph: customAnalysisViewToObject,
    },
  ];
}

function Item({
  script,
  dynamoLocal,
  setEnv,
  setGraph,
}: {
  setEnv: (env: "daas" | "local") => void;
  script: any;
  setGraph: (graph: JSONGraph) => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
  };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          cursor: "pointer",
          padding: "8px 8px 8px 0px",
          margin: "1px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flexDirection: "row", display: "flex", overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              width: "24px",
              height: "24px",
              justifyContent: "center",
              alignItems: "center",
              rotate: isExpanded ? "90deg" : "0deg",
            }}
          >
            <Arrow />
          </div>
          <div style={{ height: "24px", alignContent: "center" }}>{script.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "row" }}>
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
                setGraph(script);
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
            onClick={() => download(script)}
          >
            <Download />
          </div>
          <div>
            <weave-button onClick={() => setGraph(script)}>Open</weave-button>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: "0 24px 8px 24px" }}>
          <div>{script.graph.Description}</div>
          <div style={{ padding: "8px 0" }}>
            <b>Author:</b> {script.graph.Author}
          </div>
          <div>
            <b>Publisher:</b> Autodesk
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicGraphs({
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
}) {
  const graphs = useSampleGraphs();

  return (
    <>
      <h4 style={{ marginLeft: "8px" }}>Graphs provided by Autodesk</h4>
      {graphs.map((script) => {
        return (
          <Item
            key={script.id}
            script={script}
            dynamoLocal={dynamoLocal}
            setEnv={setEnv}
            setGraph={setGraph}
          />
        );
      })}
    </>
  );
}
