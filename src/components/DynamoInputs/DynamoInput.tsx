import { Input } from "./types";
import { isSelect } from "../../utils/node";
import { Housing } from "./Housing";
import { GraphInfo } from "../../service/dynamo";
import { WarningIcon } from "../../icons/Warning";

function DynamoInputComponent({
  input,
  value,
  setValue,
  setActiveSelectionNode,
}: {
  input: Input;
  value: any;
  setValue: (id: string, v: any) => void;
  setActiveSelectionNode?: (input: Input) => void;
}) {
  if (input.type === "FormaTerrain" || input.type === "GetTerrain") {
    return null;
  } else if (input.type === "FormaProject" || input.type === "GetProject") {
    return null;
  } else if (input.type === "FormaHousingTemplate") {
    return <Housing input={input} value={value} setValue={setValue} />;
  } else if (isSelect(input)) {
    return (
      <div style={{ display: "flex", flexDirection: "row" }}>
        {value && <span>{value.length} Selected</span>}
        {!value && <WarningIcon />}
        <weave-button
          style={{ marginLeft: "5px" }}
          variant="outlined"
          onClick={() => setActiveSelectionNode?.(input)}
        >
          Select
        </weave-button>
      </div>
    );
  } else if (input.type === "StringInput") {
    return (
      <weave-input
        type="text"
        value={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "BoolSelector") {
    return (
      <weave-checkbox checked={value} onChange={(ev) => setValue(input.id, ev.detail.checked)} />
    );
  } else if (input.type === "DoubleSlider") {
    return (
      <>
        <weave-slider
          min={input.nodeTypeProperties.minimumValue}
          max={input.nodeTypeProperties.maximumValue}
          step={input.nodeTypeProperties.stepValue}
          value={value}
          onInput={(ev) => setValue(input.id, ev.detail)}
        />
        <span>{value}</span>
      </>
    );
  } else if (input.type === "IntegerSlider64Bit") {
    return (
      <>
        <weave-slider
          min={input.nodeTypeProperties.minimumValue}
          max={input.nodeTypeProperties.maximumValue}
          step={input.nodeTypeProperties.stepValue}
          value={value}
          onInput={(ev) => setValue(input.id, ev.detail)}
        />
        <span>{value}</span>
      </>
    );
  } else if (input.type === "DoubleInput") {
    return (
      <weave-input
        type="number"
        value={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "DSDropDownBase" || input.type === "CustomSelection") {
    return (
      <forma-select-native
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.detail.value)}
        value={value}
      >
        {input.nodeTypeProperties.options.map((name: string, i) => (
          <option value={i} key={i}>
            {name}
          </option>
        ))}
      </forma-select-native>
    );
  } else if (input.type === "Filename") {
    return (
      <weave-input
        type="text"
        value={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  } else if (input.type === "Directory") {
    return (
      <weave-input
        type="text"
        value={value}
        // @ts-ignore
        onChange={(ev) => setValue(input.id, ev.target.value)}
      />
    );
  }
  return null;
}

export function DynamoInput({
  script,
  state,
  setValue,
  setActiveSelectionNode,
}: {
  script: GraphInfo;
  state: Record<string, any>;
  setValue: (id: string, v: any) => void;
  setActiveSelectionNode?: (input: Input | undefined) => void;
}) {
  return (
    <div>
      <div
        style={{
          padding: "5px",
          backgroundColor: "var(--background-filled-level100to250-default)",
          borderBottom: "1px solid var(--divider-lightweight)",
          borderTop: "1px solid var(--divider-lightweight)",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        Inputs
      </div>

      {(script.inputs || []).map((input: Input) => (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 0 5px 5px",
            lineHeight: "24px",
            borderBottom: "1px solid var(--divider-lightweight)",
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
      ))}

      {script.inputs?.length === 0 && (
        <div
          style={{
            padding: "5px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>No inputs</span>
          <weave-button
            variant="flat"
            onClick={() =>
              window.open(
                "https://help.autodeskforma.com/en/articles/8560252-dynamo-player-extension-for-forma-beta#h_163069ec88",
                "_blank",
              )
            }
          >
            Learn how
          </weave-button>
        </div>
      )}
    </div>
  );
}
