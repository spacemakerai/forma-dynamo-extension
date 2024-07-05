import { Download } from "../../assets/icons/Download";
import sphereAreaGraph from "../../assets/spherearea.json";
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
  return [{ id: "1", type: "JSON", name: "Sphere Area", graph: sphereAreaGraph }];
}

export function PublicGraphs({ setGraph }: { setGraph: (graph: JSONGraph) => void }) {
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
