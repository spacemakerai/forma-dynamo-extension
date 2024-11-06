import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import Dynamo, { DaasState, DynamoService } from "../service/dynamo";
import { Forma } from "forma-embedded-view-sdk/auto";
import { useDynamoConnector } from "../DynamoConnector";
import { captureException } from "../util/sentry";
import { SetupWizard } from "../components/SetupDesktop/SetupWizard";
import styles from "./Pages.module.pcss";
import AppContent from "./AppContent";

const envionment = new URLSearchParams(window.location.search).get("ext:daas") || "prod";

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

export enum ShareDestination {
  Project = "project",
  Hub = "hub",
}

async function addClaimsToToken(token: string) {
  const projectId = Forma.getProjectId();
  return await Forma.getIframeMessenger().sendRequest("auth/add-token-claims", {
    token,
    authcontext: projectId,
  });
}

async function prepareFormaToken() {
  const { accessToken } = await Forma.auth.acquireTokenOverlay();
  return await addClaimsToToken(accessToken);
}

export type AppPageState =
  | {
      name: "default";
    }
  | {
      name: "setup";
    }
  | {
      name: "publish";
      initialValue?: any;
      initialShareDestination: ShareDestination;
    };

export function DaasApp() {
  const [env, setEnv] = useState<"daas" | "local">("daas");

  const [page, setPage] = useState<AppPageState>({ name: "default" });

  const [isHubEditor, setIsHubEditor] = useState<boolean>(false);
  const [isProjectEditor, setIsProjectEditor] = useState<boolean>(false);
  useEffect(() => {
    Forma.getCanEditHub().then(setIsHubEditor);
    Forma.getCanEdit().then(setIsProjectEditor);
  }, []);

  const daas = useMemo(() => {
    return new Dynamo(urls[String(envionment).toUpperCase()] || urls["DEV"], async () => {
      const accessToken = await prepareFormaToken();
      return `Bearer ${accessToken}`;
    });
  }, []);

  const onTabChange = (e: CustomEvent) => {
    if (e.detail.tabContentId === "localContent" && env === "daas") {
      setEnv("local");
    }
    if (e.detail.tabContentId === "dynamoServiceContent" && env === "local") {
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
            isProjectEditor={isProjectEditor}
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
          {dynamoLocal.state.connectionState === "CONNECTED" ? (
            <AppContent
              page={page}
              setPage={setPage}
              isHubEditor={isHubEditor}
              isProjectEditor={isProjectEditor}
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
