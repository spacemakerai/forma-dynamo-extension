import { Forma } from "forma-embedded-view-sdk/auto";
import { useState } from "preact/hooks";
import { useEffect } from "preact/compat";

function useCurrentSelection() {
  const [selection, setSelection] = useState<string[]>([]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      setSelection(await Forma.selection.getSelection());
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  return selection;
}

export function SelectMode({
  activeSelectionNode,
  setActiveSelectionNode,
  setValue,
}: any) {
  const selection = useCurrentSelection();
  const onClickConfirm = async () => {
    setValue(activeSelectionNode.id, selection);
    setActiveSelectionNode(undefined);
  };
  const onClickCancel = async () => {
    setActiveSelectionNode(undefined);
  };
  return (
    <div>
      <h2>Select in the canvas</h2>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "16px",
        }}
      >
        <div>{activeSelectionNode.name}</div>
        <div style={{ fontWeight: "700" }}>
          {selection.length} elements selected
        </div>
      </div>

      <div
        style={{ display: "flex", justifyContent: "end", marginTop: "14px" }}
      >
        <weave-button variant="flat" onClick={onClickCancel}>
          Cancel
        </weave-button>
        <weave-button
          style={{ marginLeft: "10px" }}
          variant="outlined"
          density="high"
          onClick={onClickConfirm}
        >
          Confirm selection
        </weave-button>
      </div>
    </div>
  );
}
