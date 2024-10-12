import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { Forma } from "forma-embedded-view-sdk/auto";
import { captureException } from "../../util/sentry.ts";
import { Output } from "./types.tsx";
import { Transform, Urn } from "forma-elements";
import { Visibility } from "../../icons/Visibility.tsx";
import * as UUID from "uuid";

type SendElementDTO = {
  urn: Urn;
  transform: Transform;
};

function useTogglePreview(renderId: string, elements: SendElementDTO[], isPreviewActive: boolean) {
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  useEffect(() => {
    if (!isPreviewLoading && isPreviewVisible !== isPreviewActive) {
      setIsPreviewLoading(true);
      if (!isPreviewVisible) {
        Forma.experimental.render.element
          .update({
            id: renderId,
            elements: elements
              .filter((element) => !!element)
              .map((element) => ({ urn: element.urn, transform: element.transform })),
          })
          .then(() => {
            setIsPreviewVisible(true);
          })
          .catch((e) => {
            captureException(e, "Failed to render preview");
          })
          .finally(() => {
            setIsPreviewLoading(false);
          });
      } else {
        Forma.experimental.render.element
          .remove({ id: renderId })
          .then(() => {
            setIsPreviewVisible(false);
          })
          .catch((e) => {
            captureException(e, "Failed to remove preview");
          })
          .finally(() => {
            setIsPreviewLoading(false);
          });
      }
    }
  }, [isPreviewLoading, isPreviewActive, elements, renderId, isPreviewVisible]);
}

function useAddElement(
  elements: SendElementDTO[],
  togglePreview: (newPreviewActiveState: boolean) => void,
) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const add = useCallback(async () => {
    setIsAdding(true);
    try {
      await Promise.all(
        elements
          .filter((element) => !!element)
          .map(({ urn, transform }) => Forma.proposal.addElement({ urn, transform })),
      );
      togglePreview(false);
      setIsAdded(true);
    } catch (e) {
      captureException(e, "Failed to add element");
    } finally {
      setIsAdding(false);
    }
  }, [elements, togglePreview]);

  return { add, isAdding, isAdded };
}

function PreviewAndAdd({ value }: { value: string[] }) {
  const [isPreviewActive, setIsPreviewActive] = useState(true);
  const [renderId] = useState(UUID.v4());

  const elements: SendElementDTO[] = useMemo(
    () => value.map((value) => JSON.parse(value)).flat(1),
    [value],
  );

  useTogglePreview(renderId, elements, isPreviewActive);

  useEffect(() => {
    return () => {
      Forma.experimental.render.element.remove({ id: renderId }).catch((e) => {
        captureException(e, "Failed to remove preview");
      });
    };
  }, []);

  const { add, isAdding, isAdded } = useAddElement(elements, setIsPreviewActive);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ marginRight: "5px" }}>{isAdding ? "Adding..." : isAdded ? "Added" : ""}</div>
      <weave-button variant="outlined" disabled={isAdding} onClick={add}>
        Add
      </weave-button>
      <Visibility
        onClick={() => setIsPreviewActive(!isPreviewActive)}
        isVisible={isPreviewActive}
      />
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
