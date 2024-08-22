import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import Dynamo, { DaasState, DynamoService, FolderGraphInfo } from "../service/dynamo";
import { LocalScript } from "./LocalScript";
import { Forma } from "forma-embedded-view-sdk/auto";
import { useDynamoConnector } from "../DynamoConnector";
import { PublicGraphs } from "../components/PublicGraphs/PublicGraphs";
import { JSONGraph } from "../types/types";
import { MyGraphs } from "../components/Sections/MyGraphs";
import { SharedGraphs } from "../components/SharedGraphs/SharedGraphs";
import { PublishGraph } from "../components/SharedGraphs/PublishGraph";
import { captureException } from "../util/sentry";

const envionment = new URLSearchParams(window.location.search).get("ext:daas") || "stg";

const urls: Record<string, string> = {
  DEV: "https://dev.service.dynamo.autodesk.com",
  STG: "https://stg.service.dynamo.autodesk.com",
  PROD: "https://service.dynamo.autodesk.com",
};

function useDaasStatus(daas: DynamoService) {
  const [daasStatus, setDaasStatus] = useState<DaasState>({ status: "offline" });

  const connect = useCallback(() => {
    (async () => {
      try {
        const serverInfo = await daas.serverInfo();
        setDaasStatus({ status: "online", serverInfo });
      } catch (e) {
        captureException(e, "Failed to connect to DaaS");
        setDaasStatus({ status: "error", error: String(e) });
      }
    })();
  }, [daas]);

  useEffect(() => {
    connect();
  }, [connect]);

  return { daasStatus, reconnect: connect };
}

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

  const { daasStatus, reconnect } = useDaasStatus(daas);

  const dynamoLocal = useDynamoConnector();

  return (
    <div>
      {page.name === "publish" && (
        <PublishGraph setPage={setPage} initialValue={page.initialValue} />
      )}
      {page.name === "default" && (
        <>
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
                daas: {
                  connected: daasStatus.status === "online",
                  state: daasStatus,
                  reconnect,
                  dynamo: daas,
                },
                local: {
                  ...dynamoLocal,
                  connected: dynamoLocal.state.connectionState === "CONNECTED",
                },
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
