import { isSelect } from "../../utils/node";


function DynamoInputComponent({
  input,
  value,
  setValue,
  setActiveSelectionNode,
}: {
  input: Input;
  value: any;
  setValue: (id: string, v: any) => void;
  setActiveSelectionNode?: (v: any) => void;
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
        <div>
          {value && <span>{value.length} Selected</span>}
          <button onClick={() => setActiveSelectionNode({id: input.id, name: input.name})}>Select</button>
        </div>
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

export function DynamoInput({ code, state, setValue, setActiveSelectionNode }: any) {
  return (code?.inputs || []).map((input: Input) => (
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
        setActiveSelectionNode={setActiveSelectionNode}
      />
    </div>
  ));
}
