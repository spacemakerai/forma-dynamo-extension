import { useState } from "preact/hooks";
import { DaasApp } from "./pages/DaasApp";
import { LocalApp } from "./pages/LocalApp";

const useDaas = new URLSearchParams(window.location.search).has("ext:daas");

function Selection() {
  const [selected, setSelected] = useState<string | null>(null);

  if (!selected) {
    return (
      <div
        key={1}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          marginTop: "50px",
          height: "50%",
        }}
      >
        <div style={{ width: "250px" }}>
          You are now testing Dynamo as a Service for Forma. Please select the Dynamo instance you
          want to open.
        </div>
        <weave-button
          style={{ width: "250px" }}
          variant="solid"
          onClick={() => setSelected("local")}
        >
          Open Local Dynamo
        </weave-button>
        <weave-button
          style={{ width: "250px" }}
          variant="solid"
          onClick={() => setSelected("daas")}
        >
          Open Dynamo as a Service for Forma
        </weave-button>
      </div>
    );
  }

  return (
    <div key={2}>
      {selected === "local" && (
        <div style={{ display: "flex", width: "100%", alignItems: "space-between" }}>
          <div>Running Local Dynamo</div>
          <weave-button variant="outlined" onClick={() => setSelected("daas")}>
            Go to DaaS
          </weave-button>
        </div>
      )}
      {selected === "daas" && (
        <div style={{ display: "flex", width: "100%", alignItems: "space-between" }}>
          <div>Running Dynamo as a Service for Forma</div>
          <weave-button variant="outlined" onClick={() => setSelected("local")}>
            Go to Local
          </weave-button>
        </div>
      )}

      {selected === "local" && <LocalApp />}
      {selected === "daas" && <DaasApp />}
    </div>
  );
}

export function App() {
  if (useDaas) {
    return <Selection />;
  }
  return <LocalApp />;
}
