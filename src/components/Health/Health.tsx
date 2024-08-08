import { useEffect, useState } from "preact/hooks";
import { IndicatorActive } from "../../assets/icons/IndicatorActive";
import { IndicatorError } from "../../assets/icons/InidcatorError";
import { IndicatorInactive } from "../../assets/icons/InidcatorInactive";
import { DynamoService, ServerInfo } from "../../service/dynamo";
import { DynamoConnectionState, DynamoState } from "../../DynamoConnector";
import { ErrorBanner } from "../Errors.tsx/ErrorBanner";
import { captureException } from "../../util/sentry";

type Status = "online" | "offline" | "error";

function StatusIcon({ status }: { status: Status }) {
  if (status === "online") {
    return <IndicatorActive />;
  } else if (status === "offline") {
    return <IndicatorInactive />;
  }
  return <IndicatorError />;
}

function Indicator({ status, name }: { status: Status; name: string; isLoading: boolean }) {
  return (
    <div
      style={{
        padding: "0 8px 0 8px",
        justifyContent: "center",
        fontSize: "12px",
        height: "24px",
        flexBasis: 0,
        flexGrow: 1,
        flexWrap: "wrap",
        display: "flex",
        alignContent: "center",
      }}
    >
      <div style={{ width: "16px", justifyContent: "center", alignContent: "center" }}>
        <StatusIcon status={status} />
      </div>
      <div style={{ height: "16px" }}>{name}</div>
    </div>
  );
}

type DaasState =
  | {
      status: "online";
      serverInfo: ServerInfo;
    }
  | {
      status: "error";
      error: string;
    }
  | {
      status: "offline";
    };

function mapLocalToState(state: DynamoConnectionState): Status {
  if (state === "CONNECTED") {
    return "online";
  } else if (state === "NOT_CONNECTED") {
    return "offline";
  }
  return "error";
}

function renderDaasDescription(state: DaasState) {
  if (state.status === "online") {
    return `Dynamo Core: ${state.serverInfo.dynamoVersion}
    Dynamo API: ${state.serverInfo.apiVersion}
    Dynamo Player ${state.serverInfo.playerVersion}`;
  }

  return "";
}

export function Health({ daas, local }: { daas: DynamoService; local: DynamoState }) {
  const [daasStatus, setDaasStatus] = useState<DaasState>({ status: "offline" });

  useEffect(() => {
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

  const daasDescription = renderDaasDescription(daasStatus);

  return (
    <>
      {daasStatus.status === "error" && (
        <ErrorBanner
          message="Could not connect to service"
          description="Are you connected to Autodesk VPN?"
        />
      )}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--divider-lightweight)",
        }}
      >
        <weave-tooltip
          text={"Dynamo as a Service (DaaS)"}
          description={daasDescription}
          link={"https://help.autodeskforma.com/"}
          nub="up-left"
        >
          <Indicator status={daasStatus.status} name="Service (DaaS)" isLoading={false} />
        </weave-tooltip>
        <Indicator
          status={mapLocalToState(local.connectionState)}
          name="Desktop"
          isLoading={true}
        />
        <weave-button style={{ flexBasis: 0, flexGrow: 1 }} onClick={() => alert("Setup")}>
          Setup Desktop
        </weave-button>
      </div>
    </>
  );
}
