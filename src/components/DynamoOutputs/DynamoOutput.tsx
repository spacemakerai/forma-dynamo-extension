import { DaaSJobStatus, DaasError, DaasRunResult } from "../../service/dynamo.ts";
import { BasicBuilding } from "./BasicBuilding.tsx";
import { ExtrudedPolygon } from "./ExtrudedPolygon.tsx";
import { GroundPolygon } from "./GroundPolygon.tsx";
import { HousingByLine } from "./HousingByLine.tsx";
import { SendElementToForma } from "./SendElementToForma.tsx";
import { SendToForma } from "./SendToForma.tsx";
import { Output } from "./types.tsx";
import { VisualizeImage } from "./VisualizeImage.tsx";
import { Watch3D } from "./Watch3d.tsx";
import { WatchImage } from "./WatchImage.tsx";

export type RunResult =
  | { type: DaaSJobStatus.CLIENT_INITIALIZED } // Initial state.
  | { type: DaaSJobStatus.CLIENT_PREPARING; uiMsg: string } // Preparing graph state.
  | { type: DaaSJobStatus.CREATED; uiMsg: string } // Job created.
  | { type: DaaSJobStatus.PENDING; uiMsg: string } // Job sent and pending execution.
  | { type: DaaSJobStatus.EXECUTING; uiMsg: string } // Job is executing.
  | { type: DaaSJobStatus.COMPLETE; uiMsg: string; data: DaasRunResult } // Job ran to completion (success).
  | { type: DaaSJobStatus.FAILED; uiMsg: string; data: DaasRunResult | DaasError } // Job failed.
  | { type: DaaSJobStatus.TIMEOUT; uiMsg: string; data: DaasRunResult }; // Job ran out of time.

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
  if (result.type === DaaSJobStatus.CLIENT_INITIALIZED) return null;
  if (result.type === DaaSJobStatus.FAILED) return <div>{result.uiMsg}</div>; // Maybe add a Timeout icon?
  if (result.type === DaaSJobStatus.TIMEOUT) return <div>{result.uiMsg}</div>; // Maybe add a Failed icon?
  if (result.type !== DaaSJobStatus.COMPLETE)
    return (
      <div>
        <weave-progress-bar />
        {result.uiMsg}
      </div>
    );

  const outputs = (result?.data?.result?.info?.outputs || []) as Output[];

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
