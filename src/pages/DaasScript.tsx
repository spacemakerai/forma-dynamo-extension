import { useCallback, useEffect, useState } from "preact/hooks";
import { DynamoService, GraphInfo } from "../service/dynamo";

type ScriptInfoResult =
  | { type: "init" }
  | { type: "loading" }
  | { type: "error"; data: any }
  | { type: "loaded"; data: GraphInfo };
function useScriptInfo(script: any, dynamo: DynamoService): [ScriptInfoResult, () => void] {
  const [state, setState] = useState<ScriptInfoResult>({ type: "init" });

  const reload = useCallback(() => {
    setState({ type: "loading" });

    dynamo
      .info({ type: "JsonGraphTarget", contents: JSON.stringify(script.graph) })
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
  }, [dynamo, script.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return [state, reload];
}

export function DaasScript({
  script,
  setScript,
  dynamo,
}: {
  script: any;
  setScript: (script: any | undefined) => void;
  dynamo: DynamoService;
}) {
  let [scriptInfo, reload] = useScriptInfo(script, dynamo);
  return <>DaasScript Loaded {script.name}</>;
}
