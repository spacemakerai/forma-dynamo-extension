import { useCallback, useMemo, useState } from "preact/hooks";
import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../util/sentry.ts";
import { Output } from "./types.tsx";
import { Transform, Urn } from "forma-elements";

type SendElementDTO = {
  urn: Urn;
  transform: Transform;
};

function useAddElement(elements: SendElementDTO[]) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const add = useCallback(async () => {
    setIsAdding(true);
    try {
      await Promise.all(
        elements.map(({ urn, transform }) => Forma.proposal.addElement({ urn, transform })),
      );
      setIsAdded(true);
    } catch (e) {
      captureException(e, "Failed to add element");
    } finally {
      setIsAdding(false);
    }
  }, [elements]);

  return { add, isAdding, isAdded };
}

function PreviewAndAdd({ value }: { value: string[] }) {
  const elements: SendElementDTO[] = useMemo(
    () => value.map((value) => JSON.parse(value)).flat(1),
    [value],
  );

  const { add, isAdding, isAdded } = useAddElement(elements);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ marginRight: "5px" }}>{isAdding ? "Adding..." : isAdded ? "Added" : ""}</div>
      <weave-button variant="outlined" disabled={isAdding} onClick={add}>
        Add
      </weave-button>
    </div>
  );
}

export function SendElementToForma({ output }: { output: Output }) {
  if (typeof output.value !== "string" && !Array.isArray(output.value)) {
    console.error(
      "Unexpected type: SendElementToForma output value is not a string or array of string",
    );
    captureException(
      new Error("Unexpected output value type"),
      "SendElementToForma output value is not a string",
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
      {output.value && <PreviewAndAdd value={value} />}
    </div>
  );
}
