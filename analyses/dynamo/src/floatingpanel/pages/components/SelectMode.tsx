import { Forma } from "forma-embedded-view-sdk/auto";
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

export function SelectMode ({activeSelectionNode, setActiveSelectionNode, setValue}: any) {
    const selection = useCurrentSelection()
    const onClick = async () => {
        setValue(activeSelectionNode.id, selection);
        setActiveSelectionNode(undefined)
    }
    return (
        <div style={{display: "flex", justifyContent: "space-between"}}>
            <div>{activeSelectionNode.name}</div>
            <div>Select in the canvas</div>
            <>{selection.length} elements selected</>
        <button onclick={onClick}>Use selection</button>
        <button onclick={() => setActiveSelectionNode(undefined)}>X</button>
    </div>)
}