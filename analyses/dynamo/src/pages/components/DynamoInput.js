import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { useCallback } from "https://esm.sh/preact/compat";
import { Forma } from "https://esm.sh/forma-embedded-view-sdk/auto";

const html = htm.bind(h);

function DynamoSelection({ input, value, setValue }) {
  const onSelect = useCallback(async () => {
    setValue(input.id, await Forma.selection.getSelection());
  }, [input]);

  return html`<button onClick=${onSelect}>Select</button> ${value &&
    html`<span>Selected ${value.length}</span>`}`;
}

function DynamoInputComponent({ input, value, setValue }) {
  if (input.name === "Triangles" || input.name === "Footprint") {
    return html`<${DynamoSelection} input=${input} setValue=${setValue} value=${value}>Select</button>`;
  } else if (input.type === "StringInput") {
    return html`<input
      type="text"
      defaultValue=${value}
      onChange=${(ev) => setValue(input.id, ev.target.value)}
    />`;
  } else if (input.type === "BoolSelector") {
    return html`<input
      type="checkbox"
      defaultChecked=${value}
      onChange=${(ev) => setValue(input.id, ev.target.checked)}
    />`;
  } else if (input.type === "DoubleSlider") {
    return html`<input
        type="range"
        min=${input.minimumValue}
        max=${input.maximumValue}
        step=${input.stepValue}
        defaultValue=${value}
        onChange=${(ev) => setValue(input.id, ev.target.value)}
      />
      <span>${value}</span>`;
  } else if (input.type === "DoubleInput") {
    return html`<input
      type="number"
      defaultValue=${value}
      onChange=${(ev) => setValue(input.id, ev.target.value)}
    />`;
  } else if (input.type === "DSDropDownBase") {
    return html` <select
      onChange=${(ev) => setValue(input.id, ev.target.value)}
    >
      defaultValue=${input.value.split(":")[1]}/>
      ${input.nodeTypeProperties.options.map(
        (name) => html`<option value="${name}">${name}</option>`
      )}
    </select>`;
  } else {
    console.log(input);
  }
}

export function DynamoInput({ code, state, setValue }) {
  return code.inputs.map(
    (input) => html`<div
      style=${{
        borderBottom: "1px solid gray",
        marginBottom: "5px",
        paddingBottom: "5px",
      }}
      key=${input.id}
    >
      ${input.name} - ${input.type}:
      <br />
      <${DynamoInputComponent}
        input=${input}
        value=${state[input.id]}
        setValue=${setValue}
      />
    </div>`
  );
}
