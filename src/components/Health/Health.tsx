import { useEffect, useState } from "preact/hooks";
import { IndicatorActive } from "../../assets/icons/IndicatorActive";
import { IndicatorError } from "../../assets/icons/InidcatorError";
import { IndicatorInactive } from "../../assets/icons/InidcatorInactive";
import { DynamoService, ServerInfo } from "../../service/dynamo";
import { DynamoConnectionState, DynamoState } from "../../DynamoConnector";

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

export function Health({ daas, local }: { daas: DynamoService; local: DynamoState }) {
  const [daasStatus, setDaasStatus] = useState<DaasState>({ status: "offline" });

  useEffect(() => {
    (async () => {
      try {
        const serverInfo = await daas.serverInfo();
        setDaasStatus({ status: "online", serverInfo });
      } catch (e) {
        setDaasStatus({ status: "error", error: String(e) });
      }
    })();
  }, [daas]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "row" }}>
      <Indicator status={daasStatus.status} name="Service (DaaS)" isLoading={false} />
      <Indicator status={mapLocalToState(local.connectionState)} name="Desktop" isLoading={true} />
      <weave-button style={{ flexBasis: 0, flexGrow: 1 }} onClick={() => alert("Setup")}>
        Setup Desktop
      </weave-button>
    </div>
  );
}
