import { useCallback, useState } from "preact/hooks";

import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../../util/sentry.ts";
import { Output } from "./types.tsx";
import { Watch3D } from "./Watch3d.tsx";

function RenderImage({ output }: { output: Output }) {
  const { id, value } = output;

  const renderOnTerrain = useCallback(async () => {
    const image = new Image();
    const bbox = await Forma.terrain.getBbox();
    image.src = `data:image/png;base64,${value}`;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(image, 0, 0);

    const x = (bbox.max.x - bbox.min.x) / image.width;
    const y = (bbox.max.y - bbox.min.y) / image.height;

    Forma.terrain.groundTexture.add({
      name: id,
      canvas,
      position: { x: 0, y: 0, z: 100 },
      scale: {
        x,
        y,
      },
    });
  }, [id, value]);

  return (
    <weave-button variant="outlined" onClick={renderOnTerrain}>
      Render to Terrain
    </weave-button>
  );
}

function DynamoOutputWatchImage({ output }: { output: Output }) {
  const [isImageVisible, setIsImageVisible] = useState(false);
  const toggleImage = useCallback(() => setIsImageVisible(!isImageVisible), [isImageVisible]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          lineHeight: "24px",
          padding: "5px 0 5px 5px",
          height: "24px",
          borderBottom: "1px solid var(--divider-lightweight)",
        }}
      >
        <span>{output.name}</span>
        {!output.value && <div>No output value</div>}

        <div style={{ display: "flex" }}>
          {output.value && output.name === "RenderTexture" && <RenderImage output={output} />}
          {output.value && (
            <weave-button onClick={toggleImage} variant="outlined">
              {isImageVisible ? "Hide" : "Show"}
            </weave-button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", width: "100%", justifyContent: "center" }}>
        {isImageVisible && (
          <img style={{ width: "350px" }} src={`data:image/png;base64,${output.value}`} />
        )}
      </div>
    </div>
  );
}

function DynamoOutputHousingByLine({ output }: { output: Output }) {
  const onAdd = useCallback(async () => {
    if (output.value) {
      try {
        const values = typeof output.value === "string" ? [output.value] : output.value;
        for (const value of values) {
          const { line, buffer, placementSide, templateId } = JSON.parse(value);

          const { urn } = await Forma.experimental.housing.createFromLine({
            line,
            buffer,
            placementSide,
            templateId: templateId !== "<default>" ? templateId : undefined,
          });

          await Forma.proposal.addElement({ urn });
        }
      } catch (e) {
        captureException(e, "Failed to add housing");
      }
    }
  }, [output]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        lineHeight: "24px",
        padding: "5px 0 5px 5px",
        height: "24px",
        borderBottom: "1px solid var(--divider-lightweight)",
      }}
    >
      <span>{output.name}</span>
      {!output.value && <div>No output value</div>}
      <button onClick={onAdd}>Add</button>
    </div>
  );
}

function DynamoOutputComponent({ output }: { output: Output }) {
  if (output.type === "Watch3D") {
    return <Watch3D output={output} />;
  }
  if (output.type === "WatchImageCore") {
    return <DynamoOutputWatchImage output={output} />;
  }

  if (output.name === "FormaHousing.ByLine") {
    return <DynamoOutputHousingByLine output={output} />;
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

export function DynamoOutput({ output }: any) {
  if (output.type === "init") return null;
  if (output.type === "error") return <div>Failed</div>;
  if (output.type === "running")
    return (
      <div>
        <weave-progress-bar />
        Running
      </div>
    );

  const outputs = (output.data?.info?.outputs || []) as Output[];

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
