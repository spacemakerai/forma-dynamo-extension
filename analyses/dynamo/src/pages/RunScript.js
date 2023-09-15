import { useState, useCallback, useEffect } from "https://esm.sh/preact/compat";
import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import * as Dynamo from "../service/dynamo.js";
import { DynamoOutput } from "./components/DynamoOutput.js";
import { DynamoInput } from "./components/DynamoInput.js";
import { Forma } from "https://esm.sh/forma-embedded-view-sdk/auto";
import { generateGeometry } from "../service/render.js";

const html = htm.bind(h);

function getDefaultValues(code) {
  const inputs = JSON.parse(code).Inputs;
  const state = {};
  for (const input of inputs) {
    if (input.Value) {
      if (input.Type === "boolean") {
        state[input.Id] = input.Value === "true";
      } else if (input.Name === "Triangles" || input.Name === "Footprint") {
        state[input.Id] = JSON.parse(input.Value.replace("\r\n", ""));
      } else {
        state[input.Id] = input.Value;
      }
    }
  }
  return state;
}

export function RunScript({ script }) {
  const code = JSON.parse(script.code);

  const [state, setState] = useState(getDefaultValues(script.code));
  const [output, setOutput] = useState({ type: "init" });

  const setValue = useCallback((id, value) =>
    setState((state) => ({ ...state, [id]: value }))
  );

  const onRun = useCallback(async () => {
    try {
      setOutput({ type: "running" });
      const urn = await Forma.proposal.getRootUrn();
      const inputs = await Promise.all(
        Object.entries(state).map(async ([id, value]) => {
          const input = code.Inputs.find((input) => input.Id === id);

          if (input.Name === "Triangles") {
            return {
              nodeId: id,
              value: JSON.stringify(
                await Promise.all(
                  value.map(async (path) => {
                    return [
                      ...(await Forma.geometry.getTriangles({ urn, path })),
                    ];
                  })
                )
              ),
            };
          } else if (input.Name === "Footprint") {
            console.log(
              value,
              await Promise.all(
                value.map(async (path) => {
                  return [
                    ...(await Forma.geometry.getFootprint({ urn, path }))
                      .coordinates,
                  ];
                })
              )
            );
            return {
              nodeId: id,
              value: JSON.stringify(
                await Promise.all(
                  value.map(async (path) => {
                    return [
                      ...(await Forma.geometry.getFootprint({ urn, path }))
                        .coordinates,
                    ];
                  })
                )
              ),
            };
          } else {
            return {
              nodeId: id,
              value: value,
            };
          }
        })
      );

      setOutput({ type: "success", data: await Dynamo.run(code, inputs) });
    } catch (e) {
      setOutput({ type: "error", data: e });
    }
  }, [code, state]);

  useEffect(() => {
    setOutput({ type: "init" });
  }, [state]);

  useEffect(() => {
    if (output.type === "success") {
      output.data.info.outputs
        .filter(({ type }) => type === "Watch3D")
        .filter(({ value }) => !!value)
        .forEach(async (output) => {
          Forma.render.updateMesh({
            id: output.Id,
            geometryData: await generateGeometry(output.value),
          });
        });
    }
  }, [output]);

  return html`
    <div>
      <h1>Run</h1>
      <div
        style=${{
          borderBottom: "1px solid gray",
          marginBottom: "5px",
          paddingBottom: "5px",
        }}
      >
        ${script.name}
      </div>
      <${DynamoInput} code=${code} state=${state} setValue=${setValue} />
      <button disabled=${output.type === "running"} onClick=${onRun}>
        Run
      </button>

      <${DynamoOutput} output=${output} />
    </div>
  `;
}
