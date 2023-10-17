import { useState } from "preact/hooks";
import downloadMetrics from "../../assets/Metrics.dyn?url";
import downloadFootprint from "../../assets/Footprint.dyn?url";
import downloadTriangles from "../../assets/Triangles.dyn?url";
import downloadAutodeskForma from "../../assets/AutodeskForma.7z?url";

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
        Templates and Library
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
            <div>Read the area metrics for the selection.</div>
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
            <div>Get json of selected ground polygons.</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h2
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadTriangles, "Triangles.dyn")}
            >
              Triangles
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
            <div>Get solids based on triangles of selected geometry.</div>
          </div>
        </div>
      )}
    </div>
  );
}