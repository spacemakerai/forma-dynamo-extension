import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { addElement } from "../../service/element";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Visibility } from "../../icons/Visibility";
import { captureException } from "../../util/sentry.ts";

type Output = {
  id: string;
  type: "Watch3D" | string;
  name: string;
  value?: string | undefined;
};

function base64ToArrayBuffer(base64: string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
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

  const add = useCallback(async () => {
    setIsAdding(true);
    try {
      await addElement(glb);
      await togglePreview(false);
      setIsAdded(true);
    } catch (e) {
      captureException(e, "Failed to add element");
    } finally {
      setIsAdding(false);
    }
  }, [glb]);

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
    [isPreviewActive, id, glb],
  );

  useEffect(() => {
    (async () => await Forma.render.glb.update({ id, glb }))();
    return async () => {
      try {
        await Forma.render.glb.remove({ id });
      } catch (e) {
        // ignore as we do not know if it is added or not
      }
    };
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ marginRight: "5px" }}>
        {isAdding ? "Adding..." : isAdded ? "Added" : ""}
      </div>
      <weave-button variant="outlined" disabled={isAdding} onClick={add}>
        Add
      </weave-button>
      <Visibility
        onClick={() => togglePreview(!isPreviewActive)}
        isVisible={isPreviewActive}
      />
    </div>
  );
}

function DynamoOutputWatch3D({ output }: { output: Output }) {
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

function DynamoOutputComponent({ output }: { output: Output }) {
  if (output.type === "Watch3D") {
    return <DynamoOutputWatch3D output={output} />;
  } else {
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
        <DynamoOutputComponent output={output} />
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
