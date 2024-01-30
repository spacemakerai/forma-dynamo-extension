import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { addElement } from "../../service/element";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Visibility } from "../../icons/Visibility";
import { captureException } from "../../util/sentry.ts";

type Output = {
  id: string;
  type: "Watch3D" | "WatchImageCore" | string;
  name: string;
  value?: string | undefined;
};

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
      await addElement(glb);
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
        const { urn } = await Forma.experimental.housing.createFromLine(JSON.parse(output.value));

        await Forma.proposal.addElement({ urn });
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
    return <DynamoOutputWatch3D output={output} />;
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
