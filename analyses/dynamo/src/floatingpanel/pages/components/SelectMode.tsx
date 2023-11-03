import {Forma} from "forma-embedded-view-sdk/auto";
import {useState} from "preact/hooks";
import {useEffect} from "preact/compat";

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

export function SelectMode({activeSelectionNode, setActiveSelectionNode, setValue}: any) {
    const selection = useCurrentSelection()

    const [hoverConfirm, setHoverConfirm] = useState(false);
    const [hoverCancel, setHoverCancel] = useState(false);

    const onClickConfirm = async () => {
        setValue(activeSelectionNode.id, selection);
        setActiveSelectionNode(undefined)
    }
    const onClickCancel = async () => {
        setActiveSelectionNode(undefined)
    }
    return (<div style={{fontSize: "11px", fontWeight: "600", color: "#3C3C3C"}}>
        <div style={{height: "16px", padding: "6px"}}>Select in the canvas</div>
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "16px",
            padding: "6px"
        }}>
            <div>{activeSelectionNode.name}</div>
            <div style={{fontWeight: "700"}}>{selection.length} elements selected</div>
        </div>
        <div style={{display: "flex", justifyContent: "end", padding: "6px"}}>
            <button
                onMouseEnter={() => setHoverCancel(true)}
                onMouseLeave={() => setHoverCancel(false)}
                style={{
                    height: "24px",
                    backgroundColor: "white",
                    padding: "4px 12px",
                    cursor: "pointer",
                    color: "#006EAF",
                    borderRadius: "2px",
                    border: `1px solid ${hoverCancel ? "black" : "white"}`,
                    marginRight: "8px",
                    fontWeight: "600",
                }} onclick={onClickCancel}>Cancel
            </button>
            <button
                onMouseEnter={() => setHoverConfirm(true)}
                onMouseLeave={() => setHoverConfirm(false)}
                style={{
                    height: "24px",
                    borderRadius: "2px",
                    border: `1px solid ${hoverConfirm ? "black" : "#BFBFBF"}`,
                    backgroundColor: "white",
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontWeight: "600",
                }} onclick={onClickConfirm}>Confirm selection
            </button>
        </div>
    </div>)
}