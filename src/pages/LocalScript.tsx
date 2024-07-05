import { useState, useCallback, useEffect, useRef } from "preact/compat";

import { DynamoOutput, RunResult } from "../components/DynamoOutputs/DynamoOutput.js";
import { DynamoInput } from "../components/DynamoInputs/DynamoInput.js";
import { Forma } from "forma-embedded-view-sdk/auto";
import { isGet, isSelect } from "../utils/node.js";
import { NotTrustedGraph } from "../components/NotTrustedGraph.js";
import { SelectMode } from "../components/SelectMode.tsx";
import { captureException } from "../util/sentry.ts";
import { getGraphBuildingForSubTree } from "../representations/graphBuilding.ts";
import { Child } from "forma-elements";
import {
  DynamoService,
  FolderGraphInfo,
  GraphInfo,
  GraphTarget,
  Input,
} from "../service/dynamo.js";
import { JSONGraph } from "../types/types.ts";

function getDefaultValues(scriptInfo: ScriptResult) {
  if (scriptInfo.type === "loaded") {
    const inputs = scriptInfo?.data?.inputs || []; // JSON.parse(code).Inputs;
    const state: any = {};

    for (const input of inputs) {
      if (isSelect(input) || isGet(input)) {
        // Intentionally ignored does not work between sessions
        continue;
      }
      if (input.value) {
        if (input.type === "boolean") {
          state[input.id] = input.value === "true";
        } else if (input.type === "DSDropDownBase" || input.type === "CustomSelection") {
          state[input.id] = input.value.split(":")[0];
        } else {
          state[input.id] = input.value;
        }
      }
    }
    return state;
  }
  return {};
}

type ScriptResult =
  | { type: "init" }
  | { type: "loading" }
  | { type: "error"; data: any }
  | { type: "loaded"; data: GraphInfo };

function useScript(script: Script, dynamo: DynamoService): [ScriptResult, () => void] {
  const [state, setState] = useState<ScriptResult>({ type: "init" });

  const reload = useCallback(() => {
    setState({ type: "loading" });

    const target: GraphTarget =
      script.type === "JSON"
        ? { type: "JsonGraphTarget", graph: script.graph }
        : { path: script.id, type: "PathGraphTarget" };

    dynamo
      .info(target)
      .then((data: any) => {
        setState({ type: "loaded", data });
      })
      .catch((err: any) => {
        if (err.status === 500 && err.message === "Graph is not trusted.") {
          setState({ type: "error", data: "GRAPH_NOT_TRUSTED" });
        } else {
          setState({ type: "error", data: err.message });
        }
      });
  }, [dynamo, script]);

  useEffect(() => {
    reload();
  }, [reload]);

  return [state, reload];
}

export function AnimatedLoading() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const start = new Date();
    const interval = setInterval(() => {
      if (start.getTime() + 3000 < new Date().getTime()) {
        setSlow(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: "100%", marginTop: "5px" }}>
      <weave-skeleton-item width="90%" style={{ marginBottom: "5px" }} />
      <weave-skeleton-item width="70%" style={{ marginBottom: "5px" }} />
      <weave-skeleton-item width="50%" style={{ marginBottom: "5px" }} />
      {slow && (
        <div style={{ marginTop: "5px" }}>
          This is taking longer than usual. Please open Dynamo and check if it is blocked with a
          message dialog.
        </div>
      )}
    </div>
  );
}

async function getVolume25DForSubTree(path: string) {
  const { element, elements } = await Forma.elements.getByPath({ path, recursive: true });

  const collections = [];
  const stack = [{ path, element }];
  while (stack.length) {
    const { path, element } = stack.pop()!;

    for (const child of element?.children ?? []) {
      stack.push({ path: `${path}/${child.key}`, element: elements[child.urn] });
    }

    const volume25DCollection = await Forma.experimental.geometry.getVolume25DCollection({ path });

    console.log({ volume25DCollection });

    collections.push(volume25DCollection);
  }

  const features = collections
    .filter((fc) => !!fc)
    .map((fc) => fc?.features)
    .flat();

  return { type: "FeatureCollection", features };
}

async function readElementsByPaths(paths: string[]) {
  const elements = await Promise.all(
    paths.map((path) =>
      Forma.elements.getByPath({ path }).then(({ element }) => (element ? element : undefined)),
    ),
  );
  const triangles = await Promise.all(
    paths.map((path) =>
      Forma.geometry
        .getTriangles({ path })
        .then((triangles) => (triangles ? [...triangles] : undefined)),
    ),
  );
  const footprints = await Promise.all(
    paths.map((path) =>
      Forma.geometry
        .getFootprint({ path })
        .then((polygon) => (polygon ? polygon.coordinates : undefined)),
    ),
  );

  const volume25DCollections = await Promise.all(paths.map((path) => getVolume25DForSubTree(path)));

  let graphs = {};
  try {
    graphs = await Promise.all(paths.map((path) => getGraphBuildingForSubTree(path)));
  } catch (e) {
    console.warn(e);
  }

  return paths.map((_, index) => ({
    element: elements[index],
    triangles: triangles[index],
    footprints: footprints[index],
    volume25DCollection: volume25DCollections[index],
    // @ts-ignore
    graphs: (graphs[index] as any) || undefined,
  }));
}

async function getAllPaths() {
  const urn = await Forma.proposal.getRootUrn();
  // @ts-ignore
  const { elements } = await Forma.elements.get({ urn, recursive: true });

  function getElementsByPath(path: string) {
    if (path === "root") {
      // @ts-ignore
      return elements[urn];
    }
    const keys = path.split("/").slice(1);
    // @ts-ignore
    let element = elements[urn];
    for (const key of keys) {
      const child = element.children?.find((child: Child) => child.key === key);
      if (!child) {
        throw new Error(`Element not found at path ${path}`);
      }
      element = elements[child?.urn];
    }
    return element;
  }

  function findAllPaths(path: string) {
    const element = getElementsByPath(path);
    const paths = [path];
    for (const child of element.children || []) {
      paths.push(...findAllPaths(`${path}/${child.key}`));
    }
    return paths;
  }

  return findAllPaths("root");
}

export type Script = FolderGraphInfo | JSONGraph;

export function LocalScript({
  script,
  setScript,
  dynamo,
}: {
  script: Script;
  setScript: any;
  dynamo: DynamoService;
}) {
  const [scriptInfo, reload] = useScript(script, dynamo);
  const [activeSelectionNode, setActiveSelectionNode] = useState<Input | undefined>(undefined);

  const [state, setState] = useState<Record<string, any>>({});

  useEffect(() => {
    if (scriptInfo.type === "loaded") {
      setState(getDefaultValues(scriptInfo));
    }
  }, [scriptInfo]);

  const [result, setResult] = useState<RunResult>({ type: "init" });

  const setValue = useCallback(
    (id: string, value: any) => setState((state) => ({ ...state, [id]: value })),
    [],
  );

  const onRun = useCallback(async () => {
    try {
      if (scriptInfo.type !== "loaded") {
        return;
      }
      const code = scriptInfo.data;
      setResult({ type: "running" });
      const urn = await Forma.proposal.getRootUrn();
      const inputs = await Promise.all(
        code.inputs.map(async ({ id, type, name }: Input) => {
          const value = state[id];

          if (
            type === "FormaSelectElements" ||
            type === "FormaSelectElement" ||
            type === "SelectElements"
          ) {
            const paths = (value || []) as string[];
            const elements = await readElementsByPaths(paths);
            return { nodeId: id, value: JSON.stringify(elements) };
          } else if (name === "GetFormaElements" || type === "GetAllElements") {
            const paths = await getAllPaths();
            const elements = await readElementsByPaths(paths);
            return { nodeId: id, value: JSON.stringify(elements) };
          } else if (type === "FormaTerrain") {
            const [path] = await Forma.geometry.getPathsByCategory({
              category: "terrain",
            });
            return {
              nodeId: id,
              value: JSON.stringify([[...(await Forma.geometry.getTriangles({ path }))]]),
            };
          } else if (type === "GetTerrain") {
            const paths = await Forma.geometry.getPathsByCategory({
              category: "terrain",
            });

            const elements = await readElementsByPaths(paths);
            return {
              nodeId: id,
              value: JSON.stringify(elements[0]),
            };
          } else if (type === "FormaProject" || type === "GetProject") {
            const project = await Forma.project.get();
            return {
              nodeId: id,
              value: JSON.stringify(project),
            };
          } else if (name === "Triangles" || type === "FormaSelectGeometry") {
            return {
              nodeId: id,
              value: JSON.stringify(
                await Promise.all(
                  (value as string[]).map(async (path) => {
                    return [...(await Forma.geometry.getTriangles({ urn, path }))];
                  }),
                ),
              ),
            };
          } else if (name === "Footprint" || type === "FormaSelectFootprints") {
            return {
              nodeId: id,
              value: JSON.stringify(
                await Promise.all(
                  (value as string[]).map(async (path) => {
                    return [
                      // @ts-ignore
                      ...(await Forma.geometry.getFootprint({ urn, path })).coordinates,
                    ];
                  }),
                ),
              ),
            };
          } else if (
            name === "Metrics" ||
            type === "FormaSelectMetrics" ||
            type === "SelectMetrics"
          ) {
            return {
              nodeId: id,
              value: JSON.stringify(
                await Forma.areaMetrics.calculate({ paths: value as string[] }),
              ),
            };
          }
          return {
            nodeId: id,
            value,
          };
        }),
      );

      const target: GraphTarget =
        script.type === "FolderGraph"
          ? { type: "PathGraphTarget", path: scriptInfo.data.id }
          : { type: "JsonGraphTarget", contents: JSON.stringify(script.graph) };
      setResult({
        type: "success",
        data: await dynamo.run(target, inputs),
      });
    } catch (e) {
      console.error(e);
      captureException(e, "Error running Dynamo graph");
      setResult({ type: "error", data: e });
    }
  }, [dynamo, scriptInfo, state, script]);

  useEffect(() => {
    setResult({ type: "init" });
  }, [state]);

  const fixedFooterHeight = 44;
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    function handleResize() {
      // @ts-ignore
      if (headerRef?.current?.offsetHeight) {
        // @ts-ignore
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {activeSelectionNode && (
        <SelectMode
          activeSelectionNode={activeSelectionNode}
          setActiveSelectionNode={setActiveSelectionNode}
          setValue={setValue}
        />
      )}
      <div
        style={{
          display: activeSelectionNode ? "none" : "block",
          height: "100%",
        }}
      >
        <div
          ref={headerRef}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>{script.name}</h3>
          <weave-button variant="flat" onClick={reload}>
            Refresh
          </weave-button>
        </div>
        <div
          style={{
            height: `calc(100% - ${fixedFooterHeight + headerHeight}px)`,
            display: "flex",
            flexDirection: "column",
            flexWrap: "nowrap",
          }}
        >
          {scriptInfo.type === "error" && scriptInfo.data === "GRAPH_NOT_TRUSTED" && (
            <NotTrustedGraph
              script={script}
              setScript={setScript}
              reload={reload}
              dynamo={dynamo}
            />
          )}
          {["init", "loading"].includes(scriptInfo.type) && <AnimatedLoading />}

          {scriptInfo.type === "loaded" && (
            <>
              <div>
                <span style={{ fontWeight: "600" }}>Description: </span>
                <span>{scriptInfo.data?.metadata?.description}</span>
              </div>
              <div
                style={{
                  marginBottom: "5px",
                  paddingBottom: "5px",
                }}
              />
              <div
                style={{
                  overflow: "auto",
                  minHeight: "20px",
                }}
              >
                <DynamoInput
                  script={scriptInfo.data}
                  state={state}
                  setValue={setValue}
                  setActiveSelectionNode={setActiveSelectionNode}
                />

                <DynamoOutput result={result} />
              </div>
            </>
          )}
        </div>
        <div
          style={{
            height: `${fixedFooterHeight - 1}px`,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            borderTop: "1px solid var(--divider-lightweight)",
          }}
        >
          <weave-button
            style={{ width: "60px", marginRight: "6px" }}
            variant="outlined"
            onClick={() => setScript(undefined)}
          >
            Back
          </weave-button>
          <weave-button
            style={{ width: "80px" }}
            variant="solid"
            disabled={result.type === "running" || scriptInfo.type !== "loaded"}
            onClick={onRun}
          >
            Run
          </weave-button>
        </div>
      </div>
    </>
  );
}
