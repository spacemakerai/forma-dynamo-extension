import areaCalculation from "../../assets/workflows/AreaCalculation.json";
// @ts-ignore
import createConstraintGraph from "../../assets/workflows/Create building Constraint.dyn";
// @ts-ignore
import createPixelTower from "../../assets/workflows/Create Pixel Tower.dyn";
// @ts-ignore
import buildingCostCalculator from "../../assets/workflows/Building Cost Calculator.dyn";
import buildingModificationGraph from "../../assets/workflows/BuildingModification.json";
import butterflyDiagram from "../../assets/workflows/ButterflyDiagram.json";
import customAnalysisIsovist from "../../assets/workflows/IsovistAnalysis.json";
import customAnalysisTerrainSlope from "../../assets/workflows/TerrainSlopeAnalysis.json";
import customAnalysisViewToObject from "../../assets/workflows/ViewToObjectAnalysis.json";

// @ts-ignore
import elementCreation from "../../assets/tools/ElementCreation.dyn";
import elementProperties from "../../assets/tools/ElementProperties.json";
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

function useSampleGraphs(): JSONGraph[] {
  return [
    { id: "area", type: "JSON", name: "Area Calculation", graph: areaCalculation },
    { id: "cost", type: "JSON", name: "Building Cost Calculator", graph: buildingCostCalculator },
    { id: "create", type: "JSON", name: "Element Creation", graph: elementCreation },
    { id: "props", type: "JSON", name: "Element Properties", graph: elementProperties },
    { id: "pixel", type: "JSON", name: "Create Pixel Tower", graph: createPixelTower },
    { id: "1", type: "JSON", name: "Create Building Constraint", graph: createConstraintGraph },
    { id: "2", type: "JSON", name: "Building Modification", graph: buildingModificationGraph },
    {
      id: "3",
      type: "JSON",
      name: "Butterfly Diagram",
      graph: butterflyDiagram,
    },
    {
      id: "4",
      type: "JSON",
      name: "Isovist Analysis",
      graph: customAnalysisIsovist,
    },
    {
      id: "5",
      type: "JSON",
      name: "Terrain Slope Analysis",
      graph: customAnalysisTerrainSlope,
    },
    {
      id: "6",
      type: "JSON",
      name: "View To Object Analysis",
      graph: customAnalysisViewToObject,
    },
  ];
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
