import { useState } from "preact/hooks";
import Dynamo from "../service/dynamo";
import sphereAreaGraph from "../assets/spherearea.json";
import { LocalScript } from "./LocalScript";

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

  const daas = new Dynamo("https://0z63s658g5.execute-api.us-west-2.amazonaws.com", async () => {
    // let { accessToken } = await Forma.auth.acquireTokenOverlay();
    // return `Bearer ${accessToken}`;
    return `Bearer <YOUR_TOKEN_HERE>`;
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
