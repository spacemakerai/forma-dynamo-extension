import { useCallback, useState } from "preact/hooks";

import { Forma } from "forma-embedded-view-sdk/auto";
import { Output } from "./types.tsx";

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

export function WatchImage({ output }: { output: Output }) {
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
