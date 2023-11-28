import { useState } from "preact/hooks";
import downloadCreateTower from "../../assets/Geometry-CreatePixelTower.dyn?url";
import downloadMetrics from "../../assets/Metrics-BuildingCostCalculator.dyn?url";

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

export function SampleFiles() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3>Sample Files</h3>
        <weave-button
          variant="outlined"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            float: "right",
            border: "none",
          }}
        >
          {isExpanded ? "Hide" : "Show"}
        </weave-button>
      </div>
      {isExpanded && (
        <div>
          <div style={{ margin: "5px 5px" }}>
            <h4
              style={{ cursor: "pointer" }}
              onClick={() =>
                download(downloadCreateTower, "CreatePixelTower.dyn")
              }
            >
              Generate Pixel Tower
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>Generate a pixelated tower and use it in Forma</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h4
              style={{ cursor: "pointer" }}
              onClick={() =>
                download(downloadMetrics, "BuildingCostCalculator.dyn")
              }
            >
              Building Cost Calculator
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>Calculate building cost based on area metrics.</div>
          </div>
        </div>
      )}
    </>
  );
}
