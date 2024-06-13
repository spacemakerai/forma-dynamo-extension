import { useMemo, useState } from "preact/hooks";
import Dynamo from "../service/dynamo";
import sphereAreaGraph from "../assets/spherearea.json";
import { LocalScript } from "./LocalScript";
import { Forma } from "forma-embedded-view-sdk/auto";
import { DaasServerInfo } from "./DaaSServerInfo";

export type JSONGraph = {
  type: "JSON";
  id: string;
  name: string;
  graph?: any;
};

function useSampleGraphs(): JSONGraph[] {
  return [
    { id: "1", type: "JSON", name: "Sample Script 1" },
    { id: "2", type: "JSON", name: "Sphere Area", graph: sphereAreaGraph },
  ];
}

const urls: Record<string, string> = {
  DEV: "https://dev.service.dynamo.autodesk.com",
  STG: "https://stg.service.dynamo.autodesk.com",
  PROD: "https://service.dynamo.autodesk.com",
};

export function DaasApp() {
  const [environment, setDynamoEnvironment] = useState<string>("STG");
  const [graph, setGraph] = useState<JSONGraph | undefined>(undefined);

  const sampleGraphs = useSampleGraphs();

  const isProd = import.meta.env.MODE === "production";
  const callbackUrl = isProd
    ? `${window.location.origin}${window.location.pathname}`
    : `${window.location.origin}/`;
  Forma.auth.configure({
    clientId: import.meta.env.VITE_EXTENSION_CLIENT_ID,
    callbackUrl,
    scopes: ["data:read", "data:write"],
  });

  const daas = useMemo(() => {
    return new Dynamo(urls[environment] || urls["STG"], async () => {
      const { accessToken } = await Forma.auth.acquireTokenOverlay();
      return `Bearer ${accessToken}`;
    });
  }, [environment]);

  return (
    <div>
      <div>
        Environment:
        <weave-button
          variant={environment === "DEV" ? "solid" : undefined}
          onClick={() => setDynamoEnvironment("DEV")}
        >
          Dev
        </weave-button>
        <weave-button
          variant={environment === "STG" ? "solid" : undefined}
          onClick={() => setDynamoEnvironment("STG")}
        >
          Stg
        </weave-button>
        <weave-button
          variant={environment === "PROD" ? "solid" : undefined}
          onClick={() => setDynamoEnvironment("PROD")}
        >
          Prod
        </weave-button>
      </div>
      {!graph &&
        sampleGraphs.map((script) => {
          return (
            <div key={script.id}>
              {script.name} <weave-button onClick={() => setGraph(script)}>Load</weave-button>
            </div>
          );
        })}
      {graph && <LocalScript script={graph} setScript={setGraph} dynamo={daas} />}
      <DaasServerInfo dynamo={daas} />
    </div>
  );
}
