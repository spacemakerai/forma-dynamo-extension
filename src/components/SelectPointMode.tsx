import { Forma } from "forma-embedded-view-sdk/auto";
import { useState } from "preact/hooks";
import { useEffect } from "preact/compat";
import { Input } from "../service/dynamo";

export function SelectPointMode({
  activeSelectPointNode,
  setActiveSelectPointNode,
  setValue,
}: {
  activeSelectPointNode: Input;
  setActiveSelectPointNode: (input: Input | undefined) => void;
  setValue: (id: string, v: any) => void;
}) {
  useEffect(() => {
    (async () => {
      const point = await Forma.designTool.getPoint();
      if (point) {
        setValue(activeSelectPointNode.id, point);
      }
      setActiveSelectPointNode(undefined);
    })();
  }, [activeSelectPointNode, setActiveSelectPointNode, setValue]);

  return (
    <div>
      <h2>Select Point in the canvas</h2>

      <>Cancel the operation by clicking the X button in the top right corner of the canvas.</>
    </div>
  );
}
