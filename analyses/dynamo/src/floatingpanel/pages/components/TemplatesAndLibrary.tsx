import { useState } from "preact/hooks";
import downloadMetrics from "../../../assets/Metrics.dyn?url";
import downloadFootprint from "../../../assets/Footprint.dyn?url";
import downloadGeometry from "../../../assets/Geometry.dyn?url";
import downloadTerrain from "../../../assets/Terrain.dyn?url";
import downloadAutodeskForma from "../../../assets/AutodeskForma.7z?url";
import downloadExtension from "../../../assets/DynamoPlayerExtension2.18.7z?url";
import downloadDynamoForma from "../../../assets/DynamoForma.7z?url";

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

export function TemplatesAndLibrary() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "10px 0",
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
              onClick={() => download(downloadDynamoForma, "DynamoForma.7z")}
            >
              Dynamo Extension Bundle
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>
              The extension and node library to install into Dynamo to connect
              to Forma.
            </div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h4
              style={{ cursor: "pointer" }}
              onClick={() =>
                download(downloadExtension, "DynamoPlayerExtension2.18.7z")
              }
            >
              Dynamo Extension
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>The extension to install into dynamo to connect to Forma.</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h4
              style={{ cursor: "pointer" }}
              onClick={() =>
                download(downloadAutodeskForma, "AutodeskForma.7z")
              }
            >
              AutodeskForma
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>Node library for building graphs</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h4
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadMetrics, "Metrics.dyn")}
            >
              Metrics
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>Template for reading the area metrics for the selection.</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h4
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadFootprint, "Footprint.dyn")}
            >
              Footprint
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>Template for getting Curves of selected ground polygons.</div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h4
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadGeometry, "Geometry.dyn")}
            >
              Geometry
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>
              Template for geting solids based on triangles of selected
              geometry.
            </div>
          </div>
          <div style={{ margin: "5px 5px" }}>
            <h4
              style={{ cursor: "pointer" }}
              onClick={() => download(downloadTerrain, "Terrain.dyn")}
            >
              Terrain
              <weave-button
                variant="flat"
                style={{
                  float: "right",
                }}
              >
                Download
              </weave-button>
            </h4>
            <div>Template for getting mesh based on triangles of terrain.</div>
          </div>
        </div>
      )}
    </>
  );
}
