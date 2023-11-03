import { Forma } from "forma-embedded-view-sdk/auto";
import { useState } from "preact/hooks";
import { useEffect } from "preact/compat";

function useCurrentSelection() {
  const [selection, setSelection] = useState<any>([]);

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
    <div style={{ fontSize: "11px", fontWeight: "600", color: "#3C3C3C" }}>
      <div style={{ height: "16px", padding: "6px" }}>Select in the canvas</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "16px",
          padding: "6px",
        }}
      >
        <div>{activeSelectionNode.name}</div>
        <div style={{ fontWeight: "700" }}>
          {selection.length} elements selected
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "end", padding: "6px" }}>
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
