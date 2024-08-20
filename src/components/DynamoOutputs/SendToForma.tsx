import { Dispatch, StateUpdater, useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { addElement, CreateIntegrateElement } from "../../service/element.ts";
import { Visibility } from "../../icons/Visibility.tsx";
import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../util/sentry.ts";
import { Output } from "./types.tsx";
import { GeometryData } from "forma-embedded-view-sdk/dist/internal/scene/render";
import { createFeatureCollection } from "../../utils/geojson.ts";

function hashCode(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function useTogglePreview(
  id: string,
  elements: CreateIntegrateElement[],
  isPreviewActive: boolean,
  setIsPreviewActive: Dispatch<StateUpdater<boolean>>,
) {
  console.log(isPreviewActive);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  return useCallback(
    async (newPreviewActiveState: boolean) => {
      if (!isPreviewLoading && newPreviewActiveState !== isPreviewActive) {
        setIsPreviewLoading(true);
        for (const element of elements) {
          const elementRenderId = `${id}+${hashCode(JSON.stringify(element))}`;
          if (element.geometry.type === "mesh") {
            if (newPreviewActiveState) {
              const geometryData: GeometryData = {
                position: new Float32Array(element.geometry.vertices),
              };
              await Forma.render.updateMesh({
                id: elementRenderId,
                geometryData,
              });
            } else {
              await Forma.render.remove({ id: elementRenderId });
            }
          } else if (element.geometry.type === "point" || element.geometry.type === "curve") {
            if (newPreviewActiveState) {
              await Forma.render.geojson.update({
                id: elementRenderId,
                geojson: createFeatureCollection(element.geometry) as any,
              });
            } else {
              await Forma.render.geojson.remove({ id: elementRenderId });
            }
          }
        }
        setIsPreviewActive(newPreviewActiveState);
        setIsPreviewLoading(false);
      }
    },
    [isPreviewLoading, isPreviewActive, setIsPreviewLoading, elements, setIsPreviewActive, id],
  );
}

function useOnElementChange(id: string, elements: CreateIntegrateElement[]) {
  useEffect(() => {
    for (const element of elements) {
      const elementRenderId = `${id}+${hashCode(JSON.stringify(element))}`;
      if (element.geometry.type === "mesh") {
        const geometryData: GeometryData = {
          position: new Float32Array(element.geometry.vertices),
          // index: meshDto.faces,
        };
        (async () => await Forma.render.updateMesh({ id: elementRenderId, geometryData }))();
      } else if (element.geometry.type === "point" || element.geometry.type === "curve") {
        const geometry = element.geometry;
        (async () =>
          await Forma.render.geojson.update({
            id: elementRenderId,
            geojson: createFeatureCollection(geometry) as any,
          }))();
      }
    }

    return async () => {
      try {
        for (const element of elements) {
          const elementRenderId = `${id}+${hashCode(JSON.stringify(element))}`;
          if (element.geometry.type === "mesh") {
            await Forma.render.remove({ id: elementRenderId });
          } else if (element.geometry.type === "point" || element.geometry.type === "curve") {
            await Forma.render.geojson.remove({ id: elementRenderId });
          }
        }
      } catch (e) {
        // ignore as we do not know if it is added or not
      }
    };
  }, [elements, id]);
}

function useAddElement(
  elements: CreateIntegrateElement[],
  togglePreview: (newPreviewActiveState: boolean) => void,
) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const add = useCallback(async () => {
    setIsAdding(true);
    try {
      await Promise.all(elements.map((element) => addElement(element)));
      await togglePreview(false);
      setIsAdded(true);
    } catch (e) {
      captureException(e, "Failed to add element");
    } finally {
      setIsAdding(false);
    }
  }, [elements, togglePreview]);

  return { add, isAdding, isAdded };
}

function PreviewAndAdd({ id, value }: { id: string; value: string[] }) {
  const [isPreviewActive, setIsPreviewActive] = useState(true);

  const elements: CreateIntegrateElement[] = useMemo(
    () => value.map((value) => JSON.parse(value)).flat(1),
    [value],
  );

  const togglePreview = useTogglePreview(id, elements, isPreviewActive, setIsPreviewActive);

  useOnElementChange(id, elements);

  const { add, isAdding, isAdded } = useAddElement(elements, togglePreview);

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

export function SendToForma({ output }: { output: Output }) {
  if (typeof output.value !== "string" && !Array.isArray(output.value)) {
    console.error("Unexpected type: SendToForma output value is not a string or array of string");
    captureException(
      new Error("Unexpected output value type"),
      "SendToForma output value is not a string",
    );
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
        <div>Unexpected value: '{output.value}'</div>
      </div>
    );
  }

  const value = Array.isArray(output.value) ? output.value.flat(10) : [output.value];
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
      {output.value && <PreviewAndAdd id={output.id} value={value} />}
    </div>
  );
}
