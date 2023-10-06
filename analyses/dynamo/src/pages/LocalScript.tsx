import { useState, useCallback, useEffect } from "preact/compat";

import * as Dynamo from "../service/dynamo.js";
import { DynamoOutput } from "./components/DynamoOutput.js";
import { DynamoInput } from "./components/DynamoInput.js";
import { Forma } from "forma-embedded-view-sdk/auto";
import { generateGeometry } from "../service/render.js";
import { Back } from "../icons/Back.js";
import dynamoIconUrn from "../icons/dynamo.png";

function getDefaultValues(scriptInfo: any) {
  if (scriptInfo.type === "loaded") {
    const inputs = scriptInfo.data.inputs; // JSON.parse(code).Inputs;
    const state: any = {};

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

type ScriptResult =
  | { type: "init" }
  | { type: "loading" }
  | { type: "loaded"; data: any };

function useScript(script: any): [ScriptResult, () => void] {
  const [state, setState] = useState<ScriptResult>({ type: "init" });

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

type Output =
  | { type: "init" }
  | { type: "running" }
  | { type: "success"; data: any }
  | { type: "error"; data: any };

export function LocalScript({ script, setPage }: any) {
  const [scriptInfo, reload] = useScript(script);

  const [state, setState] = useState<Record<string, any>>({});

  useEffect(() => {
    if (scriptInfo.type === "loaded") {
      setState(getDefaultValues(scriptInfo));
    }
  }, [scriptInfo]);

  const [output, setOutput] = useState<Output>({ type: "init" });

  const setValue = useCallback(
    (id: string, value: any) =>
      setState((state) => ({ ...state, [id]: value })),
    []
  );

  const onRun = useCallback(async () => {
    try {
      if (scriptInfo.type !== "loaded") {
        return;
      }
      const code = scriptInfo.data;
      setOutput({ type: "running" });
      const urn = await Forma.proposal.getRootUrn();
      const inputs = await Promise.all(
        Object.entries(state).map(async ([id, value]) => {
          const input = code.inputs.find(
            (input: { id: string }) => input.id === id
          );

          if (input.name === "Triangles") {
            return {
              nodeId: id,
              value: JSON.stringify(
                await Promise.all(
                  (value as string[]).map(async (path) => {
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
                  (value as string[]).map(async (path) => {
                    return [
                      // @ts-ignore
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
  }, [scriptInfo, state]);

  useEffect(() => {
    setOutput({ type: "init" });
  }, [state]);

  useEffect(() => {
    if (output.type === "success") {
      output.data.info.outputs
        .filter(({ type }: any) => type === "Watch3D")
        .filter(({ value }: any) => !!value)
        .forEach(async (output: any) => {
          const geometryData = await generateGeometry(output.value);
          if (geometryData) {
            Forma.render.updateMesh({ id: output.Id, geometryData });
          }
        });
    }
  }, [output]);

  if (scriptInfo.type !== "loaded") {
    return <div> Loading script ... </div>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Back onClick={() => setPage("ScriptList")} />
        <h1
          onClick={() => reload()}
          style={{
            cursor: "pointer",
            fontFamily: "Artifact Element",
            marginLeft: "5px",
            fontSize: "12px",
          }}
        >
          {script.name}
        </h1>

        <img src={dynamoIconUrn} />
      </div>
      <div></div>

      {scriptInfo.type !== "loaded" ? (
        <div> Opening script in dynamo ... </div>
      ) : (
        <div>
          <div
            style={{
              marginBottom: "5px",
              paddingBottom: "5px",
            }}
          ></div>
          <DynamoInput
            code={scriptInfo.data}
            state={state}
            setValue={setValue}
          />
          <button
            style={{
              width: "100%",
              backgroundColor: "#0696D7",
              border: "none",
              borderRadius: "2px",
              height: "24px",
              color: "white",
              padding: "4px, 12px, 4px, 12px",
              cursor: "pointer",
            }}
            disabled={output.type === "running"}
            onClick={onRun}
          >
            Run
          </button>

          <DynamoOutput output={output} />
        </div>
      )}
    </div>
  );
}
