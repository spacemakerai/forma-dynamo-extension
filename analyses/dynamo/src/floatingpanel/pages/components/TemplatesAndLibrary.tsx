import { useState } from "preact/hooks";
import downloadMetrics from "../../../assets/Metrics.dyn?url";
import downloadFootprint from "../../../assets/Footprint.dyn?url";
import downloadGeometry from "../../../assets/Geometry.dyn?url";
import downloadTerrain from "../../../assets/Terrain.dyn?url";
import downloadAutodeskForma from "../../../assets/AutodeskForma.7z?url";
import downloadExtension from "../../../assets/DynamoPlayerExtension2.18.7z?url";

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

export function TemplatesAndLibrary() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{ margin: "10px 0" }}>
      <h1
        style={{ cursor: "pointer" }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        Assets
        <button
          style={{
            float: "right",
            border: "none",
            background: "white",
            cursor: "pointer",
          }}
        >
          {isExpanded ? "Hide" : "Show"}
        </button>
      </h1>

      {isExpanded && (
        <div>
          <div style={{ margin: "5px 5px" }}>
            <h2
              style={{ cursor: "pointer" }}
              onClick={() =>
                download(downloadTerrain, "DynamoPlayerExtension2.18.7z")
              }
            >
              Dynamo Extension
              <button
                style={{
                  float: "right",
                  border: "none",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
            </h2>
            <div>The extension to install into dynamo to connect to Forma.</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h2
              style={{ cursor: "pointer" }}
              onClick={() =>
                download(downloadAutodeskForma, "AutodeskForma.7z")
              }
            >
              AutodeskForma
              <button
                style={{
                  float: "right",
                  border: "none",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
            </h2>
            <div>Node library for building graphs</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h2
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadMetrics, "Metrics.dyn")}
            >
              Metrics
              <button
                style={{
                  float: "right",
                  border: "none",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
            </h2>
            <div>Template for reading the area metrics for the selection.</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h2
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadFootprint, "Footprint.dyn")}
            >
              Footprint
              <button
                style={{
                  float: "right",
                  border: "none",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
            </h2>
            <div>Template for getting Curves of selected ground polygons.</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h2
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadGeometry, "Geometry.dyn")}
            >
              Geometry
              <button
                style={{
                  float: "right",
                  border: "none",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
            </h2>
            <div>
              Template for geting solids based on triangles of selected
              geometry.
            </div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h2
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadTerrain, "Terrain.dyn")}
            >
              Terrain
              <button
                style={{
                  float: "right",
                  border: "none",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
            </h2>
            <div>Template for getting mesh based on triangles of terrain.</div>
          </div>
        </div>
      )}
    </div>
  );
}
