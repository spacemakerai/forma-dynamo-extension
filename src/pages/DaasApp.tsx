import { useMemo, useState } from "preact/hooks";
import Dynamo, { FolderGraphInfo } from "../service/dynamo";
import { LocalScript } from "./LocalScript";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Health } from "../components/Health/Health";
import { useDynamoConnector } from "../DynamoConnector";
import { PublicGraphs } from "../components/PublicGraphs/PublicGraphs";
import { JSONGraph } from "../types/types";
import { MyGraphs } from "../components/Sections/MyGraphs";
import { SharedGraphs } from "../components/SharedGraphs/SharedGraphs";
import { PublishGraph } from "../components/SharedGraphs/PublishGraph";

const envionment = new URLSearchParams(window.location.search).get("ext:daas") || "stg";

const urls: Record<string, string> = {
  DEV: "https://dev.service.dynamo.autodesk.com",
  STG: "https://stg.service.dynamo.autodesk.com",
  PROD: "https://service.dynamo.autodesk.com",
};

export function DaasApp() {
  const [env, setEnv] = useState<"daas" | "local">("daas");
  const [graph, setGraph] = useState<JSONGraph | FolderGraphInfo | undefined>(undefined);
  const [page, setPage] = useState<
    { name: "default" } | { name: "setup" } | { name: "publish"; initialValue?: any }
  >({ name: "default" });

  const daas = useMemo(() => {
    return new Dynamo(urls[String(envionment).toUpperCase()] || urls["DEV"], async () => {
      const { accessToken } = await Forma.auth.acquireTokenOverlay();
      return `Bearer ${accessToken}`;
    });
  }, []);

  const dynamoLocal = useDynamoConnector();

  return (
    <div>
      {page.name === "publish" && (
        <PublishGraph setPage={setPage} initialValue={page.initialValue} />
      )}
      {page.name === "default" && (
        <>
          <Health daas={daas} local={dynamoLocal.state} />
          {!graph && (
            <>
              <MyGraphs
                setEnv={setEnv}
                setGraph={setGraph}
                dynamoLocal={dynamoLocal}
                setPage={setPage}
              />
              <SharedGraphs
                setPage={setPage}
                setEnv={setEnv}
                setGraph={setGraph}
                dynamoLocal={dynamoLocal}
              />
              <PublicGraphs setEnv={setEnv} setGraph={setGraph} dynamoLocal={dynamoLocal} />
            </>
          )}
          {graph && (
            <LocalScript
              env={env}
              setEnv={setEnv}
              script={graph}
              setScript={setGraph}
              services={{
                daas: { dynamo: daas },
                local: dynamoLocal,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
