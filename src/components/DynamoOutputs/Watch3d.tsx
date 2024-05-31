import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { addGlbElement } from "../../service/element.ts";
import { Visibility } from "../../icons/Visibility.tsx";
import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../util/sentry.ts";
import { Output } from "./types.tsx";

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function PreviewAndAdd({ id, value }: { id: string; value: string }) {
  const [isPreviewActive, setIsPreviewActive] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const glb = useMemo(() => base64ToArrayBuffer(value), [value]);

  const togglePreview = useCallback(
    async (newPreviewActiveState: boolean) => {
      if (!isPreviewLoading && newPreviewActiveState !== isPreviewActive) {
        setIsPreviewLoading(true);
        if (newPreviewActiveState) {
          await Forma.render.glb.update({ id, glb });
        } else {
          await Forma.render.glb.remove({ id });
        }
        setIsPreviewActive(newPreviewActiveState);
        setIsPreviewLoading(false);
      }
    },
    [isPreviewLoading, isPreviewActive, id, glb],
  );

  const add = useCallback(async () => {
    setIsAdding(true);
    try {
      await addGlbElement(glb);
      await togglePreview(false);
      setIsAdded(true);
    } catch (e) {
      captureException(e, "Failed to add element");
    } finally {
      setIsAdding(false);
    }
  }, [glb, togglePreview]);

  useEffect(() => {
    (async () => await Forma.render.glb.update({ id, glb }))();
    return async () => {
      try {
        await Forma.render.glb.remove({ id });
      } catch (e) {
        // ignore as we do not know if it is added or not
      }
    };
  }, [glb, id]);

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

export function Watch3D({ output }: { output: Output }) {
  if (typeof output.value !== "string") {
    console.error("Unexpected type: Watch3D output value is not a string");
    captureException(
      new Error("Unexpected output value type"),
      "Watch3D output value is not a string",
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
        <div>Unexpected value</div>
      </div>
    );
  }

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
