import { useState } from "preact/hooks";
import { DaasScript } from "./DaasScript";
import Dynamo from "../service/dynamo";
import testGraph from "../assets/test.json";

type Script = {
  id: string;
  name: string;
  graph?: any;
};

function useSampleScripts(): Script[] {
  return [
    { id: "1", name: "Sample Script 1" },
    { id: "2", name: "Sample Script 2", graph: testGraph },
  ];
}

export function DaasApp() {
  const [script, setScript] = useState<Script | undefined>(undefined);

  const scripts = useSampleScripts();

  const daas = new Dynamo("https://0z63s658g5.execute-api.us-west-2.amazonaws.com");

  console.log(scripts);

  console.log(script);

  return (
    <div>
      {!script &&
        scripts.map((script) => {
          return (
            <div key={script.id}>
              {script.name} <weave-button onClick={() => setScript(script)}>Load</weave-button>
            </div>
          );
        })}
      {script && <DaasScript script={script} setScript={setScript} dynamo={daas} />}
    </div>
  );
}
