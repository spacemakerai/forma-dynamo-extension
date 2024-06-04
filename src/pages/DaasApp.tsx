// import { useState } from "preact/hooks";

type Script = {
  id: string;
  name: string;
};

function useSampleScripts(): Script[] {
  return [
    { id: "1", name: "Sample Script 1" },
    { id: "2", name: "Sample Script 2" },
  ];
}

export function DaasApp() {
  //const [script, setScript] = useState<Script | undefined>(undefined);

  const scripts = useSampleScripts();

  console.log(scripts);

  return (
    <div>
      {scripts.map((script) => {
        <div key={script.id}>{script.name}</div>;
      })}
    </div>
  );
}
