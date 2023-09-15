import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

export function DynamoOutput({ output }) {
  if (output.type === "init") return null;
  if (output.type === "error") return html`<div>Failed</div>`;
  if (output.type === "running") return html`<div>Loading...</div>`;

  const outputs = output.data?.info?.outputs || [];

  return html`<div>
    ${outputs
      .filter(({ type }) => type !== "Watch3D")
      .map(
        (output) => html`<div
          style=${{
            borderBottom: "1px solid gray",
            marginBottom: "5px",
            paddingBottom: "5px",
          }}
        >
          ${output.name} ${output.value}
        </div>`
      )}
  </div>`;
}
