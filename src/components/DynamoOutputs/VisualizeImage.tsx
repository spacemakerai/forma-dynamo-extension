import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { Output } from "./types";

import { Forma } from "forma-embedded-view-sdk/auto";
import { Visibility } from "../../icons/Visibility";

type OutputValue = {
  point: {
    x: number;
    y: number;
  };
  resolution: number;
  width: number;
  height: number;
  dataUrl: string;
};

async function renderOnTerrain(output: OutputValue, id: string) {
  const { dataUrl, resolution, point, width, height } = output;
  const img = new Image();
  img.src = dataUrl;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.drawImage(img, 0, 0);

  Forma.terrain.groundTexture.add({
    name: id,
    canvas,
    position: {
      x: point.x,
      y: point.y,
      z: 100,
    },
    scale: {
      x: resolution,
      y: resolution,
    },
  });
}

export function VisualizeImage({ output }: { output: Output }) {
  const [isToggled, setIsToggled] = useState<boolean>(Boolean(output.value));
  const toggle = useCallback(() => setIsToggled(!isToggled), [isToggled]);

  const deserializedOutput = useMemo(() => {
    if (!output.value) {
      throw new Error("No output");
    }
    try {
      return JSON.parse(output.value as string) as OutputValue;
    } catch (e) {
      console.error("failed to parse output");
      throw new Error("Failed to parse json image");
    }
  }, [output.value]);

  useEffect(() => {
    if (isToggled) {
      renderOnTerrain(deserializedOutput, output.id);
    } else {
      Forma.terrain.groundTexture.remove({ name: output.id });
    }
  }, [deserializedOutput, isToggled, output.id]);

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
        {!output.value ? (
          <div>No output value</div>
        ) : (
          <Visibility onClick={toggle} isVisible={isToggled} />
        )}
      </div>
    </div>
  );
}
