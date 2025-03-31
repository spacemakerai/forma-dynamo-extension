import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../util/sentry.ts";
import { Output } from "./types.tsx";
import { Visibility } from "../../icons/Visibility.tsx";
import { FeatureCollection, Polygon } from "geojson";
import { v4 } from "uuid";

type SiteLimitValue = {
  closedCurve: { x: number; y: number }[];
  name: string;
};

type BasicElement = {
  id: string;
  name: string;
  category: string;
  geometry: {
    type: "polygon";
    coordinates: [number, number][][];
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

function closeCurve(points: number[][]) {
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    points.push(first);
  }
  return points as [number, number][];
}

async function addLimit(category: string, featureCollection: FeatureCollection<Polygon>) {
  for (const feature of featureCollection.features) {
    try {
      const coordinates = feature.geometry.coordinates.map(closeCurve);

      const urns = await createBasicElement([
        {
          id: v4(),
          name: feature.properties?.name,
          category,
          geometry: {
            type: "polygon",
            coordinates,
          },
          userData: {},
        },
      ]);

      if (urns.length > 0) {
        const { urn } = urns[0];
        await Forma.proposal.addElement({ urn, name: feature.properties?.name });
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
      (typeof value === "string" ? [value] : value).map((v) => JSON.parse(v)) as SiteLimitValue[],
    [value],
  );

  const features = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: values.map((v) => ({
        id: v.name,
        type: "Feature",
        properties: {
          name: v.name,
        },
        geometry: {
          type: "Polygon",
          coordinates: [v.closedCurve.map((p) => [p.x, p.y])],
        },
      })),
    } as FeatureCollection<Polygon>;
  }, [values]);

  const togglePreview = useCallback(
    async (newPreviewActiveState: boolean) => {
      if (!isPreviewLoading && newPreviewActiveState !== isPreviewActive) {
        setIsPreviewLoading(true);
        if (newPreviewActiveState) {
          await Forma.render.geojson.update({ id, geojson: features });
        } else {
          await Forma.render.geojson.remove({ id });
        }
        setIsPreviewActive(newPreviewActiveState);
        setIsPreviewLoading(false);
      }
    },
    [isPreviewLoading, isPreviewActive, id, features],
  );

  const add = useCallback(async () => {
    setIsAdding(true);
    try {
      await addLimit(category, features);
      await togglePreview(false);
      setIsAdded(true);
    } catch (e) {
      captureException(e, "Failed to add element");
    } finally {
      setIsAdding(false);
    }
  }, [category, features, togglePreview]);

  useEffect(() => {
    (async () => {
      await Forma.render.geojson.update({ id, geojson: features });
    })();
    return async () => {
      try {
        await Forma.render.geojson.remove({ id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // ignore as we do not know if it is added or not
      }
    };
  }, [features, id]);

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

export function GroundPolygon({ category, output }: { category: string; output: Output }) {
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
