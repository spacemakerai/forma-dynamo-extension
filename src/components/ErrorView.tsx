import { useState } from "preact/hooks";

function TabHeaders({ label, onClick, isActive }: any) {
  return (
    <span
      style={{
        cursor: "pointer",
        margin: "5px",
        borderBottom: isActive ? "2px solid var(--text-active)" : "2px solid lightgray",
      }}
      onClick={onClick}
    >
      {label}
    </span>
  );
}

export function ErrorView() {
  const [app, setApp] = useState("revit");

  return (
    <div>
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>⚠️</div>
        <div>Not able to connect to Dynamo.</div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ minWidth: "15px" }}>-</div>
        <div>
          Are Dynamo and the DynamoFormaBeta package installed, and is Dynamo running? If so, check
          Dynamo for any open dialogs that may be blocking.
        </div>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>-</div>
        <div>Dynamo not installed: Follow installation directions below</div>
      </div>
      <br />
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "var(--divider-lightweight)",
        }}
      />
      <br />
      <TabHeaders onClick={() => setApp("revit")} label={"Revit"} isActive={app === "revit"} />
      <TabHeaders onClick={() => setApp("civil")} label={"Civil 3D"} isActive={app === "civil"} />
      <TabHeaders
        onClick={() => setApp("sandbox")}
        label={"Dynamo Sandbox"}
        isActive={app === "sandbox"}
      />
      <br />
      <br />
      {app === "revit" && <Revit />}
      {app === "civil" && <Civil />}
      {app === "sandbox" && <Sandbox />}
    </div>
  );
}

function Sandbox() {
  return (
    <>
      <div>Follow these directions to install Dynamo Sandbox and the DynamoFormaBeta package.</div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>1.</div>
        <div>
          Download Dynamo 2.18.0 or higher from{" "}
          <a href="https://dynamobuilds.com/" target="_blank" rel="noreferrer">
            daily builds
          </a>
        </div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>2.</div>
        <div>
          Extract Dynamo using{" "}
          <a target="_blank" href={"https://7-zip.org/"} rel="noreferrer">
            7zip
          </a>{" "}
          to a folder of your choice.
        </div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>3.</div>
        <div>Run DynamoSandbox.exe from the Dynamo install folder</div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>4.</div>
        <div>
          If you have Dynamo 2.x you should install the 'DynamoFormaBeta for 2.x' package from the
          Package Manager in Dynamo.
          <br />
          If you have Dynamo 3.x you should install the 'DynamoFormaBeta' package from the Package
          Manager in Dynamo.
        </div>
      </div>
    </>
  );
}

function Revit() {
  return (
    <>
      <div>Follow these directions to set up Revit and the DynamoFormaBeta package.</div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>1.</div>
        <div>Make sure you have Revit 2024.1 or higher installed with Dynamo</div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>2.</div>
        <div>Open Dynamo from Revit</div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>3.</div>
        <div>
          If you have Revit 2024 you should install the 'DynamoFormaBeta for 2.x' package from the
          Package Manager in Dynamo.
          <br />
          If you have Revit 2025 you should install the 'DynamoFormaBeta' package from the Package
          Manager in Dynamo.
        </div>
      </div>
    </>
  );
}

function Civil() {
  return (
    <>
      <div>Follow these directions to set up Civil 3D and the DynamoFormaBeta package.</div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>1.</div>
        <div>Make sure you have Civil 3D 2024.1 or higher installed with Dynamo</div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>2.</div>
        <div>Open Dynamo from Civil 3D</div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>3.</div>
        <div>
          If you have Civil 3D 2024 you should install the 'DynamoFormaBeta for 2.x' package from
          the Package Manager in Dynamo.
          <br />
          If you have Civil 3D 2025 you should install the 'DynamoFormaBeta' package from the
          Package Manager in Dynamo.
        </div>
      </div>
    </>
  );
}
