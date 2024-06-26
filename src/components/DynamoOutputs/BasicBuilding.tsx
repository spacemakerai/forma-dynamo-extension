import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../util/sentry.ts";
import { Output } from "./types.tsx";
import { Floor } from "forma-embedded-view-sdk/dist/internal/elements";
import { Visibility } from "../../icons/Visibility.tsx";
import { GeometryData } from "forma-embedded-view-sdk/dist/internal/scene/render";
import earcut from "earcut";

type BasicBuildingValue = {
  position: { x: number; y: number; z: number };
  points: { x: number; y: number }[];
  stories: number;
  storyHeight: number;
};

async function addBuildings(values: BasicBuildingValue[]) {
  const elements = [];
  for (const { position, points, stories, storyHeight } of values) {
    const pts: [number, number][] = points.map(({ x, y }) => [x, y]);
    const polygon = [...pts, pts[0]];

    const floors: Floor[] = [];
    for (let i = 0; i < stories; i++) {
      floors.push({ polygon, height: storyHeight });
    }

    const { x, y, z } = position;

    // prettier-ignore
    const transform = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
          ];
    elements.push({ floors, transform });
  }
  await Promise.all(
    elements.map(async ({ floors, transform }) => {
      const { urn } = await Forma.elements.floorStack.createFromFloors({ floors });
      await Forma.proposal.addElement({ urn, transform });
    }),
  );
}

function isCounterClockwise(points: { x: number; y: number }[]) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += (next.x - current.x) * (next.y + current.y);
  }
  return sum > 0;
}

function generateGeometryData(values: BasicBuildingValue[]): GeometryData {
  const allPositions = [];

  for (const { position: offset, points, stories, storyHeight } of values) {
    if (isCounterClockwise(points)) {
      points.reverse();
    }

    const positionFloor: number[] = points
      .map(({ x, y }) => [x + offset.x, y + offset.y, offset.z])
      .flat();

    const positionCeiling: number[] = points
      .map(({ x, y }) => [x + offset.x, y + offset.y, offset.z + stories * storyHeight])
      .flat();

    for (const index of earcut(
      points
        .map(({ x, y }) => [x, y])
        .reverse()
        .flat(),
    )) {
      allPositions.push(
        positionFloor[index * 3],
        positionFloor[index * 3 + 1],
        positionFloor[index * 3 + 2],
      );
    }

    for (const index of earcut(points.map(({ x, y }) => [x, y]).flat())) {
      allPositions.push(
        positionCeiling[index * 3],
        positionCeiling[index * 3 + 1],
        positionCeiling[index * 3 + 2],
      );
    }

    for (let i = 0; i < points.length; i++) {
      const i_1 = i === points.length - 1 ? 0 : i + 1;

      const p1 = points[i];
      const p2 = points[i_1];

      allPositions.push(p1.x + offset.x, p1.y + offset.y, offset.z);
      allPositions.push(p2.x + offset.x, p2.y + offset.y, offset.z);
      allPositions.push(p1.x + offset.x, p1.y + offset.y, offset.z + stories * storyHeight);

      allPositions.push(p2.x + offset.x, p2.y + offset.y, offset.z);
      allPositions.push(p2.x + offset.x, p2.y + offset.y, offset.z + stories * storyHeight);
      allPositions.push(p1.x + offset.x, p1.y + offset.y, offset.z + stories * storyHeight);
    }
  }

  return { position: new Float32Array(allPositions) };
}

function PreviewAndAdd({ id, value }: { id: string; value: string | string[] }) {
  const [isPreviewActive, setIsPreviewActive] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const values = (typeof value === "string" ? [value] : value).map((v) =>
    JSON.parse(v),
  ) as BasicBuildingValue[];

  const geometryData = useMemo(() => generateGeometryData(values), [values]);

  const togglePreview = useCallback(
    async (newPreviewActiveState: boolean) => {
      if (!isPreviewLoading && newPreviewActiveState !== isPreviewActive) {
        setIsPreviewLoading(true);
        if (newPreviewActiveState) {
          await Forma.render.updateMesh({ id, geometryData });
        } else {
          await Forma.render.remove({ id });
        }
        setIsPreviewActive(newPreviewActiveState);
        setIsPreviewLoading(false);
      }
    },
    [isPreviewLoading, isPreviewActive, id, geometryData],
  );

  const add = useCallback(async () => {
    setIsAdding(true);
    try {
      await addBuildings(values);
      await togglePreview(false);
      setIsAdded(true);
    } catch (e) {
      captureException(e, "Failed to add element");
    } finally {
      setIsAdding(false);
    }
  }, [values, togglePreview]);

  useEffect(() => {
    (async () => await Forma.render.updateMesh({ id, geometryData }))();
    return async () => {
      try {
        await Forma.render.remove({ id });
      } catch (e) {
        // ignore as we do not know if it is added or not
      }
    };
  }, [geometryData, id]);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ marginRight: "5px" }}>{isAdding ? "Adding..." : isAdded ? "Added" : ""}</div>
      <weave-button variant="outlined" disabled={isAdding} onClick={add}>
        Add
      </weave-button>
      <Visibility onClick={() => togglePreview(!isPreviewActive)} isVisible={isPreviewActive} />
    </div>
  );
}

export function BasicBuilding({ output }: { output: Output }) {
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
      {output.value && <PreviewAndAdd id={output.id} value={output.value} />}
    </div>
  );
}
