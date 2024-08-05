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
      <h4>Graphs provided by Autodesk</h4>
      {graphs.map((script) => {
        return (
          <div
            key={script.id}
            style={{
              padding: "4px 8px 4px 8px",
              margin: "1px",
              backgroundColor: "var(--divider-lightweight)",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <div style={{ height: "24px", alignContent: "center" }}>{script.name}</div>
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
        );
      })}
    </>
  );
}
