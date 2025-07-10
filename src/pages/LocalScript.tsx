import { useState, useCallback, useEffect, useRef, useMemo } from "preact/compat";

import { DynamoOutput, RunResult } from "../components/DynamoOutputs/DynamoOutput.js";
import { DynamoInput } from "../components/DynamoInputs/DynamoInput.js";
import { Forma } from "forma-embedded-view-sdk/auto";
import { isGet, isSelect } from "../utils/node.js";
import { NotTrustedGraph } from "../components/NotTrustedGraph.js";
import { SelectMode } from "../components/SelectMode.tsx";
import { captureException } from "../util/sentry.ts";
import {
  Child,
  JsonRepresentations,
  Representation,
  RepresentationSelection,
  Volume25D,
} from "forma-elements";
import {
  DaasState,
  DynamoService,
  FolderGraphInfo,
  GraphInfo,
  GraphTarget,
  Input,
  TimeoutError,
} from "../service/dynamo.js";
import { JSONGraph, UnSavedGraph } from "../types/types.ts";
import { WarningBanner } from "../components/Warnings/WarningBanner.tsx";
import { DynamoState } from "../DynamoConnector.ts";
// import { IndicatorActive } from "../assets/icons/IndicatorActive.tsx";
// import { IndicatorInactive } from "../assets/icons/InidcatorInactive.tsx";
// import { IndicatorError } from "../assets/icons/InidcatorError.tsx";
import { filterUnsupportedPackages, Package } from "../utils/daasSupportedPackages.ts";
import { transformCoordinates } from "../utils/transformCoordinates.ts";
import { SelectPointMode } from "../components/SelectPointMode.tsx";
import { DisplayPreferences } from "../components/DisplayPreferences.tsx";

// type Status = "online" | "offline" | "error";

const IdentityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

// function StatusIcon({ status }: { status: Status }) {
//   if (status === "online") {
//     return <IndicatorActive />;
//   } else if (status === "offline") {
//     return <IndicatorInactive />;
//   }
//   return <IndicatorError />;
// }

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
        : script.type === "FolderGraph"
          ? { path: script.id, type: "PathGraphTarget" }
          : { type: "CurrentGraphTarget" };

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
        <>
          <div style={{ marginTop: "5px" }}>This is taking longer than usual.</div>
          <div style={{ marginTop: "5px" }}>
            Please open Dynamo and check if it is blocked with a message dialog.
          </div>
        </>
      )}
    </div>
  );
}

async function loadVolume25Collection(
  representation?: Representation<JsonRepresentations["volume25DCollection"]>,
): Promise<JsonRepresentations["volume25DCollection"] | undefined> {
  if (!representation) return undefined;
  switch (representation.type) {
    case "linked": {
      const data = await Forma.elements.blobs.get({ blobId: representation.blobId });
      return JSON.parse(
        new TextDecoder().decode(data.data),
      ) as JsonRepresentations["volume25DCollection"];
    }
    case "embedded-json":
      return representation.data;
    default:
      return;
  }
}

function createSelectionPredicate(selection?: RepresentationSelection) {
  console.log({ selection });
  switch (selection?.type) {
    case undefined:
      return () => true;
    case "equals":
      return (value: string) => value === selection.value;
    case "startsWith":
      return (value: string) => value.startsWith(selection.value);
    default:
      throw new Error(`Invalid selection: ${JSON.stringify(selection ?? {})}`);
  }
}

async function getVolume25DForSubTree(path: string) {
  const { element, elements } = await Forma.elements.getByPath({ path, recursive: true });

  console.log(path, elements);

  const collections = [];
  const stack = [{ path, element }];
  while (stack.length) {
    const { path, element } = stack.pop()!;
    for (const child of element?.children ?? []) {
      stack.push({ path: `${path}/${child.key}`, element: elements[child.urn] });
    }
    const volume25DCollectionRep = element.representations?.volume25DCollection;
    const volume25DCollection = await loadVolume25Collection(volume25DCollectionRep)!;
    if (!volume25DCollection) continue;

    const { transform } = await Forma.elements.getWorldTransform({ path });
    const selectionPredicate = createSelectionPredicate(volume25DCollectionRep?.selection);
    const filteredVolume25DCollection = volume25DCollection.features.filter((f) =>
      selectionPredicate(f.id),
    );

    const transformedVolume25DCollection = {
      type: "FeatureCollection" as const,
      features: filteredVolume25DCollection.map((feature: Volume25D) => {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            // Scale height by 3rd diagonal element in transform matrix
            height: feature.properties.height * transform[10],
            // Translate and scale elevation -- default untransformed elevation is zero
            elevation: (feature.properties.elevation ?? 0 * transform[10]) + transform[14],
          },
          geometry: {
            ...feature.geometry,
            coordinates: feature.geometry.coordinates.map((coordinates) =>
              transformCoordinates(transform, coordinates),
            ),
          },
        };
      }),
    };

    console.log({ transformedVolume25DCollection });

    collections.push(transformedVolume25DCollection);
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

  return paths.map((_, index) => ({
    element: elements[index],
    triangles: triangles[index],
    footprints: footprints[index],
    volume25DCollection: volume25DCollections[index],
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

export type Script = FolderGraphInfo | JSONGraph | UnSavedGraph;

function createGraphTarget(script: Script, scriptInfo: ScriptResult): GraphTarget {
  if (script.type === "FolderGraph" && scriptInfo.type === "loaded") {
    return { type: "PathGraphTarget", path: scriptInfo.data.id };
  } else if (script.type === "JSON") {
    return { type: "JsonGraphTarget", contents: JSON.stringify(script.graph) };
  } else if (script.type === "UNSAVED") {
    return { type: "CurrentGraphTarget" };
  }

  throw new Error(`Invalid script type: ${JSON.stringify(script.type)}`);
}

function serviceIncludesCurrentFunction(
  service: DynamoService,
): service is DynamoService & { current: () => Promise<GraphInfo | undefined> } {
  return (service as DynamoService & { current: () => Promise<GraphInfo> }).current !== undefined;
}

export function LocalScript({
  env,
  // setEnv,
  script,
  setScript,
  services,
}: {
  env: "daas" | "local";
  setEnv: (env: "daas" | "local") => void;
  script: Script;
  setScript: any;
  services: {
    daas?: {
      connected: boolean;
      state: DaasState;
      reconnect: () => void;
      dynamo: DynamoService;
    };
    local: {
      connected: boolean;
      state: DynamoState;
      reconnect: () => void;
      dynamo: DynamoService;
    };
  };
}) {
  const service = services[env]!;

  const [scriptInfo, reload] = useScript(script, service.dynamo);

  const description =
    (scriptInfo.type === "loaded" && scriptInfo.data?.metadata?.description) ??
    (script.type === "JSON" && script.graph.Description);

  const [activeSelectionNode, setActiveSelectionNode] = useState<Input | undefined>(undefined);
  const [activeSelectPointNode, setActiveSelectPointNode] = useState<Input | undefined>(undefined);

  const [state, setState] = useState<Record<string, any>>({});

  useEffect(() => {
    if (scriptInfo.type === "loaded") {
      setState(getDefaultValues(scriptInfo));
    }
  }, [scriptInfo]);

  const [result, setResult] = useState<RunResult>({ type: "init" });

  useEffect(() => {
    // TODO: There exists some strangeness (maybe a bug somewhere):
    // - Open in local dynamo a script that is saved from one of the "Graphs provided by Autodesk" e.g. cloud models.
    // - Open the script here, but from the "Graphs provided by Autodesk" section. e.g. open a new cloud copy.
    // The local script and the cloud model is now linked, and running the cloud model will run the local script.
    // The names in dynamo and dynamo extensions are however out of sync.
    // **May be related to the name variable that is rendered below.**

    const isUsingLocalDynamo = env === "local";
    const hasExtensionLoadedItsScript = scriptInfo.type === "loaded";
    if (!isUsingLocalDynamo || !hasExtensionLoadedItsScript) return;

    const dynamoService = services.local.dynamo;
    if (!serviceIncludesCurrentFunction(dynamoService)) {
      console.error("Service does not include current function");
      return;
    }

    // clearInterval() does not cancel promises. This variable cancels any state changes.
    let isCancelled = false;
    const interval = setInterval(async () => {
      // May throw exceptions if not connected to local dynamo or if local dynamo is busy. Ignore them.
      const graphActiveInDynamoLocal = await dynamoService.current().catch(() => undefined);

      const scriptIsLocalUnsavedCopyOfActiveScriptHere = graphActiveInDynamoLocal?.id !== "";
      const dynamoAndExtensionHasSameScriptId = graphActiveInDynamoLocal?.id === scriptInfo.data.id;

      // Case: Script has changed in local dynamo, Update the script in the extension.
      if (
        !isCancelled &&
        graphActiveInDynamoLocal !== undefined &&
        scriptIsLocalUnsavedCopyOfActiveScriptHere &&
        !dynamoAndExtensionHasSameScriptId
      ) {
        setScript({ type: "FolderGraph", ...graphActiveInDynamoLocal });
        return;
      }

      // Case: Same script has changed in local dynamo, (e.g. updated input/output nodes) reload the script in the extension.
      /*if (
        !isCancelled &&
        graphActiveInDynamoLocal !== undefined &&
        dynamoAndExtensionHasSameScriptId &&
        !isSameScripts(scriptInfo.data, graphActiveInDynamoLocal)
      ) {
        console.log(
          "reload script",
          graphActiveInDynamoLocal !== undefined,
          dynamoAndExtensionHasSameScriptId,
          !isSameScripts(scriptInfo.data, graphActiveInDynamoLocal),
        );
        reload();
        return;
      }*/
    }, 1000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [env, reload, scriptInfo, services.local.dynamo, setScript]);

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
      var lastStatus: RunResult = { type: "preparing", uiMsg: "Preparing job" };
      setResult(lastStatus);

      const urn = await Forma.proposal.getRootUrn();

      const inputs = await Promise.all(
        code.inputs.map(async ({ id, type, name }: Input) => {
          const value = state[id];
          if (type === "SelectElementsHttp" || type === "SelectElementsExperimental") {
            const paths = (value || []) as string[];

            const elements = await Promise.all(
              paths.map(async (path) => ({
                urn: (await Forma.elements.getByPath({ path })).element?.urn,
                path,
                worldTransform:
                  path === "root"
                    ? IdentityMatrix
                    : (await Forma.elements.getWorldTransform({ path })).transform,
              })),
            );

            return {
              nodeId: id,
              value: JSON.stringify({ elements, region: Forma.getRegion() }),
            };
          } else if (type === "GetAllElementsHttp" || type === "GetAllElementsExperimental") {
            const urn = await Forma.proposal.getRootUrn();

            return {
              nodeId: id,
              value: JSON.stringify({
                elements: [{ urn, path: "root", worldTransform: IdentityMatrix }],
                region: Forma.getRegion(),
              }),
            };
          } else if (
            type === "GetProjectHttp" ||
            type === "GetProjectExperimental" ||
            type === "GetSiteHttp"
          ) {
            return {
              nodeId: id,
              value: JSON.stringify({
                projectId: Forma.getProjectId(),
                siteId: Forma.getProjectId(),
                region: Forma.getRegion(),
              }),
            };
          } else if (type === "GetTerrainHttp" || type === "GetTerrainExperimental") {
            const [path] = await Forma.geometry.getPathsByCategory({
              category: "terrain",
            });
            const { element } = await Forma.elements.getByPath({ path });
            const { transform } = await Forma.elements.getWorldTransform({ path });

            return {
              nodeId: id,
              value: JSON.stringify({
                elements: [{ urn: element.urn, path, worldTransform: transform }],
                region: Forma.getRegion(),
              }),
            };
          } else if (
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
          } else if (type === "SelectPoint") {
            const point = value;
            return {
              nodeId: id,
              value: JSON.stringify(point),
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
          } else if (type === "StringInput") {
            return {
              nodeId: id,
              value: value ? String(value) : "",
            };
          }

          return {
            nodeId: id,
            value,
          };
        }),
      );

      const graphTarget = createGraphTarget(script, scriptInfo);

      const result = await service.dynamo.run(graphTarget, inputs, (status: string) => {
        // Update intermediate job status.
        if (status === "CREATED") {
          setResult({type: "created", uiMsg: "Job created"});
        } else if (status === "PENDING") {
          setResult({type: "pending", uiMsg: "Job pending"});
        } else if (status === "EXECUTING") {
           setResult({type: "executing", uiMsg: "Job executing"});
        }
      });

      setResult({type: "complete", uiMsg: "Job complete", data: result});
    } catch (e) {
      // errors caught in the forma code.
      console.error(e);
      captureException(e, "Error running Dynamo graph");

      if (e instanceof TimeoutError) {
        setResult({ type: "timeout", uiMsg: "Job timed out", data: e });
      } else {
        setResult({type: "failed", uiMsg: "Job failed", data: e});
      }
    }
  }, [service.dynamo, scriptInfo, state, script]);

  useEffect(() => {
    if (localStorage.getItem("dynamoRunOnLoad") === "true") {
      if (service.connected !== false && scriptInfo.type === "loaded") {
        localStorage.removeItem("dynamoRunOnLoad");
        onRun();
      }
    }
  }, [service.connected, scriptInfo.type, onRun]);

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

  const unsupportedPackages = useMemo(() => {
    if (env !== "daas") {
      return [];
    }

    if (script.type === "FolderGraph") {
      return [];
    }

    return filterUnsupportedPackages(script.graph);
  }, [env, script]);

  const storedPreferences = useMemo(() => {
    const stored = localStorage.getItem("dynamoPreferences");
    if (stored) {
      return JSON.parse(stored);
    }
    return { sortNodes: false, hideCollectNodes: false };
  }, []);
  const [preferences, setPreferences] = useState(storedPreferences);

  useEffect(() => {
    localStorage.setItem("dynamoPreferences", JSON.stringify(preferences));
  }, [preferences]);

  return (
    <>
      {activeSelectionNode && (
        <SelectMode
          activeSelectionNode={activeSelectionNode}
          setActiveSelectionNode={setActiveSelectionNode}
          setValue={setValue}
        />
      )}
      {activeSelectPointNode && (
        <SelectPointMode
          activeSelectPointNode={activeSelectPointNode}
          setActiveSelectPointNode={setActiveSelectPointNode}
          setValue={setValue}
        />
      )}
      <div
        style={{
          display: activeSelectionNode || activeSelectPointNode ? "none" : "block",
          paddingBottom: `${fixedFooterHeight + 20}px`,
        }}
      >
        {/* <weave-button
          style={{ marginTop: "16px" }}
          variant="outlined"
          onClick={() => setScript(undefined)}
        >
          {"<"} Back
        </weave-button> */}
        <div
          ref={headerRef}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/** Before the scriptInfo === loaded, use the script.name */}
          <h3>{(scriptInfo.type === "loaded" && scriptInfo.data.name) || script.name}</h3>

          <DisplayPreferences preferences={preferences} setPreferences={setPreferences} />
        </div>
        <div
          style={{
            height: `calc(100% - ${fixedFooterHeight + headerHeight + 16 + 24}px)`,
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
              dynamo={service.dynamo}
            />
          )}
          {!service.connected && (
            <div>
              Not connected to Dynamo
              {/* <div>
                <weave-button
                  style={{ marginTop: "16px" }}
                  variant="outlined"
                  onClick={() => setEnv(env === "local" ? "daas" : "local")}
                >
                  Switch to {env === "local" ? "Service" : "Desktop"}
                </weave-button>
              </div> */}
              {env === "daas" && (
                <div>
                  Are you connected to Autodesk VPN? This is required in the current development
                  phase.
                </div>
              )}
              {env == "local" && (
                <div>
                  <weave-button
                    style={{ marginTop: "16px" }}
                    variant="solid"
                    onClick={service.reconnect}
                  >
                    Retry
                  </weave-button>
                </div>
              )}
              {/* {env == "local" && (
                <div>
                  <weave-button
                    style={{ marginTop: "16px" }}
                    variant="solid"
                    onClick={() => console.log("setup")}
                  >
                    Setup Desktop connection
                  </weave-button>
                </div>
              )} */}
            </div>
          )}
          {["init", "loading"].includes(scriptInfo.type) && <AnimatedLoading />}

          {scriptInfo.type === "loaded" && (
            <>
              {description && (
                <div>
                  <span>{description}</span>
                </div>
              )}
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
                  preferences={preferences}
                  setActiveSelectionNode={setActiveSelectionNode}
                  setActiveSelectPointNode={setActiveSelectPointNode}
                />

                <DynamoOutput result={result} />
              </div>
            </>
          )}
        </div>
        {result.type === "complete" && result.data.title?.includes("Required property") && (
          <div>Failed</div>
        )}
        {result.type === "complete" && result.data.info?.issues?.length > 0 && (
          <WarningBanner
            title={"The graph returned with warnings or errors."}
            warnings={result.data.info.issues.map((issue) => ({
              id: issue.nodeId,
              title: issue.nodeName,
              description: issue.message,
            }))}
          />
        )}
        {unsupportedPackages.length !== 0 && (
          <WarningBanner
            title="Unsupported packages"
            description={
              <div>
                The graph uses packages which are not installed on the Service.
                <div>
                  {unsupportedPackages.map(({ Name, Version }) => (
                    <div key={Name + Version}>- {Name}</div>
                  ))}
                </div>
                You can run this graph on your Desktop.
              </div>
            }
            warnings={unsupportedPackages.map(({ Name, Version }: Package) => ({
              description: Name,
              id: Name + Version,
              title: "Unsupported package on Service",
            }))}
          />
        )}
        <div
          style={{
            height: `${fixedFooterHeight - 1}px`,
            display: "flex",
            alignItems: "center",
            bottom: 0,
            left: 0,
            right: 0,
            margin: "4px 16px",
            backgroundColor: "white",
            position: "fixed",
            justifyContent: "space-between",
            borderTop: "1px solid var(--divider-lightweight)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-start", flexDirection: "row" }}>
            {env === "local" && (
              <>
                {/* <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: "0 8px",
                    width: "18px",
                    height: "18px",
                  }}
                >
                  <Desktop />
                </div>
                Desktop
                <div style={{ marginLeft: "3px", display: "flex" }}>
                  <StatusIcon status={service.connected ? "online" : "error"} />
                </div> */}
                <weave-button variant="outlined" onClick={() => setScript(undefined)}>
                  Back
                </weave-button>
              </>
            )}
            {env === "daas" && (
              <>
                <weave-button variant="outlined" onClick={() => setScript(undefined)}>
                  Back
                </weave-button>
                {/* <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: "-1px 8px",
                    width: "18px",
                    height: "18px",
                  }}
                >
                  <Service />
                </div>
                Service
                <div style={{ marginLeft: "3px", display: "flex" }}>
                  <StatusIcon status={service.connected ? "online" : "offline"} />
                </div> */}
              </>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {env === "local" && (
              <weave-button style={{ margin: "0 8px", width: "60px" }} onClick={reload}>
                Update
              </weave-button>
            )}
            <weave-button
              style={{ width: "40px", margin: "0" }}
              variant="solid"
              disabled={
                service.connected === false ||
                result.type === "pending" || result.type === "executing" || 
                result.type === "created" || result.type === "preparing" ||
                scriptInfo.type !== "loaded" ||
                unsupportedPackages.length > 0
              }
              onClick={onRun}
            >
              Run
            </weave-button>

            {/* {services.daas && services.local && <EnvironmentSelector env={env} setEnv={setEnv} />} */}
          </div>
        </div>
      </div>
    </>
  );
}

// function isSameScripts(graphA: GraphInfo, graphB: GraphInfo): boolean {
//   return (
//     graphA.id === graphB.id &&
//     graphA.name === graphB.name &&
//     graphA.metadata.description === graphB.metadata.description &&
//     graphA.inputs.length === graphB.inputs.length &&
//     graphA.outputs.length === graphB.outputs.length &&
//     graphA.inputs.every((input) => {
//       const inputInDynamo = graphB.inputs.find((it) => it.id === input.id);
//       return inputInDynamo !== undefined && inputInDynamo.value === input.value;
//     }) &&
//     graphA.outputs.every((input) => {
//       const inputInDynamo = graphB.outputs.find((it) => it.id === input.id);
//       return inputInDynamo !== undefined && inputInDynamo.value === input.value;
//     })
//   );
// }
