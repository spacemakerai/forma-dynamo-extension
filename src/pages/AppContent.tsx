import { useMemo, useState } from "preact/hooks";
import allGraphs from "../assets/graphs";
import { PublicGraphs } from "../components/PublicGraphs/PublicGraphs";
import { QuickStart } from "../components/QuickStart";
import { MyGraphs } from "../components/Sections/MyGraphs";
import { PublishGraph } from "../components/SharedGraphs/PublishGraph";
import { SharedGraphs } from "../components/SharedGraphs/SharedGraphs";
import { DynamoState } from "../DynamoConnector";
import Dynamo, { DaasState, DynamoService, FolderGraphInfo } from "../service/dynamo";
import { JSONGraph, UnSavedGraph } from "../types/types";
import { AppPageState, ShareDestination } from "./DaasApp";
import { LocalScript } from "./LocalScript";

type Props = {
  page: AppPageState;
  setPage: (page: AppPageState) => void;
  isHubEditor: boolean;
  isProjectEditor: boolean;
  setEnv: (env: "daas" | "local") => void;
  dynamoLocal: {
    state: DynamoState;
    dynamo: DynamoService;
    reconnect: () => void;
  };
  env: "daas" | "local";
  daasStatus: DaasState;
  reconnect: () => void;
  daas: Dynamo;
};

const AppContent = ({
  page,
  setPage,
  isHubEditor,
  isProjectEditor,
  setEnv,
  dynamoLocal,
  env,
  daasStatus,
  reconnect,
  daas,
}: Props) => {
  const [graph, setGraph] = useState<JSONGraph | FolderGraphInfo | UnSavedGraph | undefined>(
    undefined,
  );
  const allowedDestinations = useMemo(() => {
    const destinations: ShareDestination[] = [];
    if (isProjectEditor) destinations.push(ShareDestination.Site);
    if (isHubEditor) destinations.push(ShareDestination.Hub);
    return destinations;
  }, [isHubEditor, isProjectEditor]);

  return (
    <>
      <QuickStart
        openSample={() => {
          const graph = allGraphs["./Terrain Slope Analysis.dyn"];

          localStorage.setItem("dynamoRunOnLoad", "true");

          graph().then((graph: any) => {
            setGraph({
              id: "Terrain Slope Analysis",
              type: "JSON",
              name: "Terrain Slope Analysis",
              graph: graph.default,
            });
          });
        }}
      />
      {page.name === "publish" && allowedDestinations.length > 0 && (
        <PublishGraph
          env={env}
          setPage={setPage}
          initialValue={page.initialValue}
          allowedDestinations={allowedDestinations}
          initialShareDestination={page.initialShareDestination}
        />
      )}
      {page.name === "default" && (
        <>
          {!graph && (
            <>
              <MyGraphs
                env={env}
                setGraph={setGraph}
                dynamoLocal={dynamoLocal}
                setPage={setPage}
                isHubEditor={isHubEditor}
                isProjectEditor={isProjectEditor}
              />
              <SharedGraphs
                env={env}
                setEnv={setEnv}
                setGraph={setGraph}
                dynamoLocal={dynamoLocal}
                isEditor={isProjectEditor}
                shareDestination={ShareDestination.Site}
                setPage={setPage}
              />
              <SharedGraphs
                env={env}
                setEnv={setEnv}
                setGraph={setGraph}
                dynamoLocal={dynamoLocal}
                isEditor={isHubEditor}
                shareDestination={ShareDestination.Hub}
                setPage={setPage}
              />
              <PublicGraphs
                env={env}
                setEnv={setEnv}
                setGraph={setGraph}
                dynamoLocal={dynamoLocal}
              />
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
    </>
  );
};

export default AppContent;
