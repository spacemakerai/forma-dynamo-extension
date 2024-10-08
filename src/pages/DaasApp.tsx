import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import Dynamo, { DaasState, DynamoService, FolderGraphInfo } from "../service/dynamo";
import { Forma } from "forma-embedded-view-sdk/auto";
import { useDynamoConnector } from "../DynamoConnector";
import { JSONGraph, UnSavedGraph } from "../types/types";
import { captureException } from "../util/sentry";
import { SetupWizard } from "../components/SetupDesktop/SetupWizard";
import styles from "./Pages.module.pcss";
import AppContent from "./AppContent";

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
  const [graph, setGraph] = useState<JSONGraph | FolderGraphInfo | UnSavedGraph | undefined>(
    undefined,
  );
  const [page, setPage] = useState<
    { name: "default" } | { name: "setup" } | { name: "publish"; initialValue?: any }
  >({ name: "default" });

  const [isHubEditor, setIsHubEditor] = useState<boolean>(false);
  useEffect(() => {
    Forma.getCanEditHub().then(setIsHubEditor);
  }, []);

  const daas = useMemo(() => {
    return new Dynamo(urls[String(envionment).toUpperCase()] || urls["DEV"], async () => {
      const { accessToken } = await Forma.auth.acquireTokenOverlay();
      return `Bearer ${accessToken}`;
    });
  }, []);

  const onTabChange = (e: CustomEvent) => {
    if (e.detail.tabContentId === "localContent") {
      setEnv("local");
    } else {
      setEnv("daas");
    }
  };

  const { daasStatus, reconnect } = useDaasStatus(daas);

  const dynamoLocal = useDynamoConnector();

  return (
    <div className={styles.AppContainer}>
      <forma-tabs selectedtab={0} gap="16" onChange={onTabChange}>
        <forma-tab for="dynamoServiceContent" hpadding="0" label="Service" />
        <div id="dynamoServiceContent" slot="content" className={styles.TabContent}>
          <AppContent
            page={page}
            setPage={setPage}
            isHubEditor={isHubEditor}
            graph={graph}
            setGraph={setGraph}
            env={env}
            setEnv={setEnv}
            daasStatus={daasStatus}
            reconnect={reconnect}
            daas={daas}
            dynamoLocal={dynamoLocal}
          />
        </div>
        <forma-tab for="localContent" hpadding="0" label="Desktop" />
        <div id="localContent" slot="content" className={styles.TabContent}>
          {dynamoLocal.state.connectionState !== "CONNECTED" ? (
            <AppContent
              page={page}
              setPage={setPage}
              isHubEditor={isHubEditor}
              graph={graph}
              setGraph={setGraph}
              env={env}
              setEnv={setEnv}
              daasStatus={daasStatus}
              reconnect={reconnect}
              daas={daas}
              dynamoLocal={dynamoLocal}
            />
          ) : (
            <SetupWizard />
          )}
        </div>
      </forma-tabs>
    </div>
  );
}
