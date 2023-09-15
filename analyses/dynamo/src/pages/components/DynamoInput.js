import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { useCallback } from "https://esm.sh/preact/compat";
import { Forma } from "https://esm.sh/forma-embedded-view-sdk/auto";

const html = htm.bind(h);

function DynamoSelection({ code, input, value, setValue }) {
  const onSelect = useCallback(async () => {
    setValue(input.Id, await Forma.selection.getSelection());
  }, [input]);

  console.log(value, typeof value, value.length);

  return html`<button onClick=${onSelect}>Select</button> ${value &&
    html`<span>Selected ${value.length}</span>`}`;
}

function DynamoInputComponent({ code, input, value, setValue }) {
  if (input.Name === "Triangles" || input.Name === "Footprint") {
    return html`<${DynamoSelection} input=${input} setValue=${setValue} value=${value}>Select</button>`;
  } else if (input.Type === "string") {
    return html`<input
      type="text"
      defaultValue=${value}
      onChange=${(ev) => setValue(input.Id, ev.target.value)}
    />`;
  } else if (input.Type === "boolean") {
    return html`<input
      type="checkbox"
      defaultChecked=${value}
      onChange=${(ev) => setValue(input.Id, ev.target.checked)}
    />`;
  } else if (input.hasOwnProperty("StepValue")) {
    return html`<input
        type="range"
        min=${input.MinimumValue}
        max=${input.MaximumValue}
        step=${input.StepValue}
        defaultValue=${value}
        onChange=${(ev) => setValue(input.Id, ev.target.value)}
      />
      <span>${value}</span>`;
  } else if (input.Type === "number") {
    return html`<input
      type="number"
      defaultValue=${value}
      onChange=${(ev) => setValue(input.Id, ev.target.value)}
    />`;
  } else if (input.Type === "selection") {
    const node = code.Nodes.find((node) => node.Id === input.Id);

    return html` <select
      onChange=${(ev) => setValue(input.Id, ev.target.value)}
    >
      defaultValue=${value}/>
      ${node.SerializedItems.map(
        (item) => html`<option value="${item.Item}">${item.Name}</option>`
      )}
    </select>`;
  } else {
    console.log(input, node);
  }
}

export function DynamoInput({ code, state, setValue }) {
  const inputs = code.Inputs || [];

  console.log(state);

  return inputs.map(
    (input) => html`<div
      style=${{
        borderBottom: "1px solid gray",
        marginBottom: "5px",
        paddingBottom: "5px",
      }}
      key=${input.Id}
    >
      ${input.Name} - ${input.Type}:
      <br />
      <${DynamoInputComponent}
        code=${code}
        input=${input}
        value=${state[input.Id]}
        setValue=${setValue}
      />
    </div>`
  );
}
