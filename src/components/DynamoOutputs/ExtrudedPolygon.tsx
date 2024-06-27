import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../util/sentry.ts";
import { Output } from "./types.tsx";
import { Visibility } from "../../icons/Visibility.tsx";
import { aquireToken } from "./auth.ts";
import { v4 } from "uuid";
import earcut from "earcut";
import { GeometryData } from "forma-embedded-view-sdk/dist/internal/scene/render";

type ConstraintValue = {
  closedCurve: { x: number; y: number }[];
  elevation: number;
  height: number;
};

type BasicElement = {
  id: string;
  name: string;
  category: string;
  geometry:
    | {
        type: "polygon";
        coordinates: [number, number][][];
      }
    | {
        type: "extrudedPolygon";
        coordinates: [number, number][][];
        height: number;
        elevation: number;
      };
  userData: Record<string, unknown>;
};

async function createBasicElement(elements: BasicElement[]) {
  const { accessToken } = await Forma.auth.acquireTokenOverlay();
  const res = await fetch(
    `https://developer.api.autodesk.com/forma/basic/v1alpha/geometries/batch-create?authcontext=${Forma.getProjectId()}`,
    {
      method: "POST",
      body: JSON.stringify(elements),
      headers: {
        "X-Ads-Region": "EMEA",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (!res.ok) {
    throw Error(`Failed to create basic element: ${res.status}: ${res.statusText}`);
  }
  const urns = (await res.json()) as [{ urn: string }];
  return urns;
}

function isCounterClockwise(points: [number, number][]) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += (next[0] - current[0]) * (next[1] + current[1]);
  }
  return sum > 0;
}

function generateGeometryData(values: ConstraintValue[]): GeometryData {
  const allPositions = [];

  for (const { closedCurve, elevation, height } of values) {
    const curve = closeCurve(closedCurve.map(({ x, y }) => [x, y]));
    if (isCounterClockwise(curve)) {
      curve.reverse();
    }

    const positionFloor: number[] = curve.flat();

    const positionCeiling: number[] = curve.map(([x, y]) => [x, y, elevation + height]).flat();

    for (const index of earcut(
      curve
        .map(([x, y]) => [x, y])
        .reverse()
        .flat(),
    )) {
      allPositions.push(
        positionFloor[index * 3],
        positionFloor[index * 3 + 1],
        positionFloor[index * 3 + 2],
      );
    }

    for (const index of earcut(curve.map(([x, y]) => [x, y]).flat())) {
      allPositions.push(
        positionCeiling[index * 3],
        positionCeiling[index * 3 + 1],
        positionCeiling[index * 3 + 2],
      );
    }

    for (let i = 0; i < curve.length; i++) {
      const i_1 = i === curve.length - 1 ? 0 : i + 1;

      const p1 = curve[i];
      const p2 = curve[i_1];

      allPositions.push(p1[0], p1[1], elevation);
      allPositions.push(p2[0], p2[1], elevation);
      allPositions.push(p1[0], p1[1], elevation + height);

      allPositions.push(p2[0], p2[1], elevation);
      allPositions.push(p2[0], p2[1], elevation + height);
      allPositions.push(p1[0], p1[1], elevation + height);
    }
  }

  return { position: new Float32Array(allPositions) };
}

function closeCurve(points: number[][]) {
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    points.push(first);
  }
  return points as [number, number][];
}

async function addLimit(category: string, constaints: ConstraintValue[]) {
  for (const constraint of constaints) {
    try {
      const urns = await createBasicElement([
        {
          id: v4(),
          category,
          name: "Extruded Polygon",
          geometry: {
            type: "extrudedPolygon",
            coordinates: [closeCurve(constraint.closedCurve.map(({ x, y }) => [x, y]))],
            height: constraint.height,
            elevation: constraint.elevation,
          },
          userData: {},
        },
      ]);

      if (urns.length > 0) {
        const { urn } = urns[0];
        await Forma.proposal.addElement({ urn });
      }
    } catch (e) {
      console.error(e);
    }
  }
}

function PreviewAndAdd({
  id,
  category,
  value,
}: {
  id: string;
  category: string;
  value: string | string[];
}) {
  const [isPreviewActive, setIsPreviewActive] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const values = useMemo(
    () =>
      (typeof value === "string" ? [value] : value).map((v) => JSON.parse(v)) as ConstraintValue[],
    [value],
  );

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
      await addLimit(category, values);
      await togglePreview(false);
      setIsAdded(true);
    } catch (e) {
      captureException(e, "Failed to add element");
    } finally {
      setIsAdding(false);
    }
  }, [category, values, togglePreview]);

  useEffect(() => {
    (async () => {
      await Forma.render.updateMesh({ id, geometryData });
    })();
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

export function ExtrudedPolygon({ category, output }: { category: string; output: Output }) {
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
      {output.value && <PreviewAndAdd category={category} id={output.id} value={output.value} />}
    </div>
  );
}
