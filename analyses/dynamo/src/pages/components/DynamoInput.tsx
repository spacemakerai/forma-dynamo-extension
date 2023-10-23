import { useCallback, useEffect, useState } from "preact/compat";
import { Forma } from "forma-embedded-view-sdk/auto";
import { isSelect } from "../../utils/node";

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

function ActiveSelection({ input, setValue, setIsSelecting }: any) {
  const currentSelection = useCurrentSelection();

  const onFinishSelection = useCallback(async () => {
    setValue(input.id, await Forma.selection.getSelection());
    setIsSelecting(false);
  }, [input]);

  return (
    <div>
      <br />
      <span>{currentSelection.length} Currently selected</span>
      <button onClick={onFinishSelection}>Use Selection</button>
    </div>
  );
}

function DynamoSelection({ input, value, setValue }: any) {
  const [isSelecting, setIsSelecting] = useState(false);

  const onClick = useCallback(async () => {
    if (isSelecting) {
      setValue(input.id, await Forma.selection.getSelection());
      setIsSelecting(false);
    } else {
      setIsSelecting(true);
    }
  }, [isSelecting, input]);

  if (isSelecting) {
    return (
      <ActiveSelection
        input={input}
        setIsSelecting={setIsSelecting}
        setValue={setValue}
      />
    );
  }

  return (
    <div>
      {value && <span>{value.length} Selected</span>}
      <button onClick={onClick}>Select</button>
    </div>
  );
}

function DynamoInputComponent({
  input,
  value,
  setValue,
}: {
  input: Input;
  value: any;
  setValue: (id: string, v: any) => void;
}) {
  if (input.type === "FormaTerrain") {
    return (
      <div>
        {value}
        <button onClick={() => setValue(input.id, "selected")}>select</button>
      </div>
    );
  } else if (isSelect(input)) {
    return (
      <DynamoSelection
        input={input}
        setValue={setValue}
        value={value}
      ></DynamoSelection>
    );
  } else if (input.type === "StringInput") {
    return (
      <input
        type="text"
        defaultValue={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "BoolSelector") {
    return (
      <input
        type="checkbox"
        defaultChecked={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.checked)}
      />
    );
  } else if (input.type === "DoubleSlider") {
    return (
      <>
        <input
          type="range"
          min={input.nodeTypeProperties.minimumValue}
          max={input.nodeTypeProperties.maximumValue}
          step={input.nodeTypeProperties.stepValue}
          defaultValue={value}
          // @ts-ignore
          onChange={(ev) => setValue(input.id, ev.target.value)}
        />
        <span>{value}</span>
      </>
    );
  } else if (input.type === "IntegerSlider64Bit") {
    return (
      <>
        <input
          type="range"
          min={input.nodeTypeProperties.minimumValue}
          max={input.nodeTypeProperties.maximumValue}
          step={input.nodeTypeProperties.stepValue}
          defaultValue={value}
          // @ts-ignore
          onChange={(ev) => setValue(input.id, ev.target.value)}
        />
        <span>{value}</span>
      </>
    );
  } else if (input.type === "DoubleInput") {
    return (
      <input
        type="number"
        defaultValue={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "DSDropDownBase") {
    return (
      <select
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
        defaultValue={input.value.split(":")[1]}
      >
        {input.nodeTypeProperties.options.map((name: string, i) => (
          <option value={i}>{name}</option>
        ))}
      </select>
    );
  } else if (input.type === "Filename") {
    return (
      <input
        type="text"
        defaultValue={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "Directory") {
    return (
      <input
        type="text"
        defaultValue={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else {
    console.log(input);
    return null;
  }
}

type Input = {
  id: string;
  name: string;
  type: string;
  value: string;
  nodeTypeProperties: {
    options: string[];
    minimumValue: number;
    maximumValue: number;
    stepValue: number;
  };
};

export function DynamoInput({ code, state, setValue }: any) {
  return (code.inputs || []).map((input: Input) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "5px",
        paddingBottom: "5px",
      }}
      key={input.id}
    >
      {input.name}
      <DynamoInputComponent
        input={input}
        value={state[input.id]}
        setValue={setValue}
      />
    </div>
  ));
}
