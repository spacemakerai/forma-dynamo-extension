import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { Output } from "./types";

import { Forma } from "forma-embedded-view-sdk/auto";
import { Visibility } from "../../icons/Visibility";

type OutputValue = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  dataUrl: string;
};

async function renderOnTerrain(output: OutputValue, id: string) {
  const { dataUrl, x0, y0, x1, y1 } = output;
  const img = new Image();
  img.src = dataUrl;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const width = (canvas.width = img.width);
  const height = (canvas.height = img.height);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.drawImage(img, 0, 0);

  const scaleX = (x1 - x0) / width;
  const scaleY = (y1 - y0) / height;

  const data = {
    name: id,
    canvas,
    position: {
      x: x0 + (width * scaleX) / 2,
      y: y0 + (height * scaleY) / 2,
      z: 100,
    },
    scale: {
      x: scaleX,
      y: scaleY,
    },
  };

  Forma.terrain.groundTexture.add(data);
}

export function VisualizeImage({ output }: { output: Output }) {
  const [isToggled, setIsToggled] = useState<boolean>(Boolean(output.value));
  const toggle = useCallback(() => setIsToggled(!isToggled), [isToggled]);

  const deserializedOutput = useMemo(() => {
    if (output.value) {
      try {
        return JSON.parse(output.value as string) as OutputValue;
      } catch (e) {
        console.error("failed to parse output", e);
      }
    }
  }, [output.value]);

  useEffect(() => {
    if (isToggled && deserializedOutput) {
      renderOnTerrain(deserializedOutput, output.id);
    } else {
      Forma.terrain.groundTexture.remove({ name: output.id });
    }
  }, [deserializedOutput, isToggled, output.id]);

  if (!output.value) {
    return null;
  }

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
