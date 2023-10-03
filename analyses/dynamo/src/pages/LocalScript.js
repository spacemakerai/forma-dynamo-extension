import { useState, useCallback, useEffect } from "https://esm.sh/preact/compat";
import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import * as Dynamo from "../service/dynamo.js";
import { DynamoOutput } from "./components/DynamoOutput.js";
import { DynamoInput } from "./components/DynamoInput.js";
import { Forma } from "https://esm.sh/forma-embedded-view-sdk/auto";
import { generateGeometry } from "../service/render.js";

const html = htm.bind(h);

function getDefaultValues(scriptInfo) {
  if (scriptInfo.type === "loaded") {
    const inputs = scriptInfo.data.inputs; // JSON.parse(code).Inputs;
    const state = {};

    for (const input of inputs) {
      if (input.value) {
        if (input.type === "boolean") {
          state[input.id] = input.value === "true";
        } else if (input.name === "Triangles" || input.name === "Footprint") {
          state[input.id] = JSON.parse(input.value.replace("\r\n", ""));
        } else {
          state[input.id] = input.value;
        }
      }
    }
    return state;
  } else {
    return {};
  }
}

function useScript(script) {
  const [state, setState] = useState({ type: "init" });

  const reload = useCallback(() => {
    setState({ type: "loading" });
    Dynamo.info(script.code).then((data) => {
      setState({ type: "loaded", data });
    });
  }, [script]);

  useEffect(() => {
    reload();
  }, [reload]);

  return [state, reload];
}

export function LocalScript({ script, setPage }) {
  const code = script.code;

  const [scriptInfo, reload] = useScript(script);

  const [state, setState] = useState(getDefaultValues(scriptInfo));
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
          const input = code.inputs.find((input) => input.id === id);

          if (input.name === "Triangles") {
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
          } else if (input.name === "Footprint") {
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

  if (scriptInfo.type !== "loaded") {
    return html`<div>Loading...</div>`;
  }

  return html`
    <div>
      <h1>Run</h1>
      <button onClick=${() => setPage("ScriptList")}>back</button>
      <button onClick=${() => reload()}>Reload</button>
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
