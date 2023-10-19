import { useCallback, useEffect, useState } from "preact/hooks";
import { addElement } from "../../service/element";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Visibility } from "../../icons/Visibility";
import { generateGeometry } from "../../service/render";

type Output = {
  id: string;
  type: "Watch3D" | string;
  name: string;
  value: string;
};

function base64ToArrayBuffer(base64: string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function DynamoOutputWatch3D({ output }: { output: Output }) {
  const [shouldShow, setShouldShow] = useState(true);

  const add = useCallback(async () => {
    try {
      if (output.value) {
        await addElement(base64ToArrayBuffer(output.value));
      } else {
        console.log("No value", output);
      }
    } catch (e) {
      console.error(e);
    }
  }, [output]);

  useEffect(() => {
    (async () => {
      if (shouldShow) {
        await Forma.render.glb.update({
          id: output.id,
          glb: base64ToArrayBuffer(output.value),
        });
      } else {
        await Forma.render.glb.remove({ id: output.id });
      }
    })();
  }, [shouldShow]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        lineHeight: "24px",
        marginBottom: "5px",
        paddingBottom: "5px",
        height: "24px",
        color: shouldShow ? "black" : "gray",
      }}
    >
      <span>{output.name}</span>

      <button
        style={{
          height: "24px",
          borderRadius: "2px",
          border: "1px solid " + (shouldShow ? "black" : "gray"),
          backgroundColor: "white",
          padding: "4px 12px",
          cursor: "pointer",
        }}
        disabled={!shouldShow}
        onClick={add}
      >
        Add
      </button>
      <Visibility
        onClick={() => setShouldShow(!shouldShow)}
        isVisible={shouldShow}
      />
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
          marginBottom: "5px",
          paddingBottom: "5px",
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
  if (output.type === "running") return <div>Loading...</div>;

  const outputs = (output.data?.info?.outputs || []) as Output[];

  return (
    <div>
      {outputs.map((output) => (
        <DynamoOutputComponent output={output} />
      ))}
    </div>
  );
}
