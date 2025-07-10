import { Output } from "./types.tsx";
import { Watch3D } from "./Watch3d.tsx";
import { HousingByLine } from "./HousingByLine.tsx";
import { WatchImage } from "./WatchImage.tsx";
import { SendToForma } from "./SendToForma.tsx";
import { Run } from "../../service/dynamo.ts";
import { BasicBuilding } from "./BasicBuilding.tsx";
import { GroundPolygon } from "./GroundPolygon.tsx";
import { ExtrudedPolygon } from "./ExtrudedPolygon.tsx";
import { SendElementToForma } from "./SendElementToForma.tsx";
import { VisualizeImage } from "./VisualizeImage.tsx";

export const RunStatus = {
  Init: { type: "init" },
  Created: { uiMsg: "Job started" }, // Job created.
  Pending: { uiMsg: "Job pending" }, // Job sent and pending execution.
  Executing: { uiMsg: "Job executing" }, // Job is executing.
  Complete: (data: Run) : RunResult => {  return {type: "complete", uiMsg: "Job completed", data}; }, // Job ran to completion (success).
  Failed: (data: any) => { uiMsg: "Job failed"; data }, // Job failed.
  Timeout: (data: any) => { uiMsg: "Job timed out"; data } // Job ran out of time.
};

export type RunResult =
  | { type: "init" } // Initial state.
  | { type: "preparing", uiMsg: string } // Preparing graph state.
  | { type: "created"; uiMsg: string } // Job created.
  | { type: "pending"; uiMsg: string } // Job sent and pending execution.
  | { type: "executing"; uiMsg: string } // Job is executing.
  | { type: "complete"; uiMsg: string; data: Run } // Job ran to completion (success).
  | { type: "failed"; uiMsg: string; data: any } // Job failed.
  | { type: "timeout"; uiMsg: string; data: any }; // Job ran out of time.

function DynamoOutputComponent({ output }: { output: Output }) {
  if (output.type === "Watch3D") {
    return <Watch3D output={output} />;
  }
  if (output.type === "WatchImageCore") {
    return <WatchImage output={output} />;
  }

  if (output.type === "VisualizeImage") {
    return <VisualizeImage output={output} />;
  }

  if (output.name === "FormaHousing.ByLine") {
    return <HousingByLine output={output} />;
  }

  if (output.name === "BasicBuilding.ByBasic") {
    return <BasicBuilding output={output} />;
  }

  if (output.name === "SiteLimit.ByAreaName") {
    return <GroundPolygon category={"site_limit"} output={output} />;
  }

  if (output.name === "Zone.ByAreaName") {
    return <GroundPolygon category={"zone"} output={output} />;
  }

  if (output.name === "Constraint.ByEnvelope") {
    return <ExtrudedPolygon category={"constraints"} output={output} />;
  }

  if (output.type === "SendToForma") {
    return <SendToForma output={output} />;
  }

  if (output.type === "SendElementsToForma" || output.type === "SendToFormaHttp") {
    return <SendElementToForma output={output} />;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px",
        lineHeight: "24px",
        borderBottom: "1px solid var(--divider-lightweight)",
      }}
    >
      <span>{output.name}</span>
      <span> {output.value}</span>
    </div>
  );
}

export function DynamoOutput({ result }: { result: RunResult }) {
  if (result.type === "init") return null;
  if (result.type === "failed") return <div>{result.uiMsg}</div>;// Maybe add a Timeout icon?
  if (result.type === "timeout") return <div>{result.uiMsg}</div>;// Maybe add a Failed icon?
  if (result.type !== "complete")
    return (
      <div>
        <weave-progress-bar />
        {result.uiMsg}
      </div>
    );

  const outputs = (result.data?.info?.outputs || []) as Output[];

  return (
    <>
      <div
        style={{
          padding: "5px",
          backgroundColor: "var(--background-filled-level100to250-default)",
          borderBottom: "1px solid var(--divider-lightweight)",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        Outputs
      </div>
      {outputs.map((output) => (
        <DynamoOutputComponent output={output} key={output.id} />
      ))}
      {outputs.length === 0 && (
        <div
          style={{
            padding: "5px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>No outputs</span>
          <weave-button
            variant="flat"
            onClick={() =>
              window.open(
                "https://help.autodeskforma.com/en/articles/8560252-dynamo-player-extension-for-forma-beta#h_071d739af8",
                "_blank",
              )
            }
          >
            Learn more
          </weave-button>
        </div>
      )}
    </>
  );
}
