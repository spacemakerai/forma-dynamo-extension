import { useState } from "preact/hooks";
import Dynamo from "../service/dynamo";
import sphereAreaGraph from "../assets/spherearea.json";
import { LocalScript } from "./LocalScript";
import { Forma } from "forma-embedded-view-sdk/auto";

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

export function DaasApp() {
  const [graph, setGraph] = useState<JSONGraph | undefined>(undefined);

  const sampleGraphs = useSampleGraphs();

  Forma.auth.configure({
    clientId: import.meta.env.VITE_EXTENSION_CLIENT_ID,
    callbackUrl: `${window.location.origin}/`, // we recommend a blank html page here
    scopes: ["data:read", "data:write"],
  });
  const daas = new Dynamo("https://0z63s658g5.execute-api.us-west-2.amazonaws.com", async () => {
    const { accessToken } = await Forma.auth.acquireTokenOverlay();
    return `Bearer ${accessToken}`;
  });

  return (
    <div>
      {!graph &&
        sampleGraphs.map((script) => {
          return (
            <div key={script.id}>
              {script.name} <weave-button onClick={() => setGraph(script)}>Load</weave-button>
            </div>
          );
        })}
      {graph && <LocalScript script={graph} setScript={setGraph} dynamo={daas} />}
    </div>
  );
}
