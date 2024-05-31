import { useCallback } from "preact/hooks";

import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../util/sentry.ts";
import { Output } from "./types.tsx";

export function HousingByLine({ output }: { output: Output }) {
  const onAdd = useCallback(async () => {
    if (output.value) {
      try {
        const values = typeof output.value === "string" ? [output.value] : output.value;
        for (const value of values) {
          const { line, buffer, placementSide, templateId } = JSON.parse(value);

          const { urn } = await Forma.experimental.housing.createFromLine({
            line,
            buffer,
            placementSide,
            templateId: templateId !== "<default>" ? templateId : undefined,
          });

          await Forma.proposal.addElement({ urn });
        }
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
