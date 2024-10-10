import { PublicGraphs } from "../components/PublicGraphs/PublicGraphs";
import { MyGraphs } from "../components/Sections/MyGraphs";
import { PublishGraph } from "../components/SharedGraphs/PublishGraph";
import { SharedGraphs } from "../components/SharedGraphs/SharedGraphs";
import { LocalScript } from "./LocalScript";
import Dynamo, { DaasState, DynamoService, FolderGraphInfo } from "../service/dynamo";
import { JSONGraph, UnSavedGraph } from "../types/types";
import { DynamoState } from "../DynamoConnector";

type Props = {
  page: { name: string; initialValue?: any };
  setPage: (
    page: { name: "default" } | { name: "setup" } | { name: "publish"; default?: any },
  ) => void;
  isHubEditor: boolean;
  graph: FolderGraphInfo | JSONGraph | UnSavedGraph | undefined;
  setGraph: (graph: FolderGraphInfo | JSONGraph | UnSavedGraph) => void;
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
  hideUploadDropZone?: boolean;
};

const AppContent = ({
  page,
  setPage,
  isHubEditor,
  graph,
  setGraph,
  setEnv,
  dynamoLocal,
  env,
  daasStatus,
  reconnect,
  daas,
  hideUploadDropZone,
}: Props) => {
  return (
    <>
      {page.name === "publish" && isHubEditor && (
        <PublishGraph setPage={setPage} initialValue={page.initialValue} />
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
                daasStatus={daasStatus}
                hideUploadDropZone={hideUploadDropZone}
              />
              <SharedGraphs
                setPage={setPage}
                setEnv={setEnv}
                setGraph={setGraph}
                dynamoLocal={dynamoLocal}
                isHubEditor={isHubEditor}
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
    </>
  );
};

export default AppContent;
