import { useCallback, useState } from "preact/hooks";

import dynamoRevitExtensionUrl from "../../../assets/DynamoPlayerExtension2.18.7z?url";

function TabHeaders({ label, onClick, isActive }: any) {
  return (
    <span
      style={{
        cursor: "pointer",
        margin: "5px",
        borderBottom: isActive
          ? "2px solid var(--text-active)"
          : "2px solid lightgray",
      }}
      onClick={onClick}
    >
      {label}
    </span>
  );
}

export function ErrorView() {
  const downloadDynamoPlayerExtension = useCallback(() => {
    window.open(dynamoRevitExtensionUrl, "_blank");
  }, []);

  const [app, setApp] = useState("sandbox");

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
          Are Dynamo and the FormaDynamo extension installed, and is Dynamo
          running? If so, check Dynamo for any open dialogs that may be
          blocking.
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
      <TabHeaders
        onClick={() => setApp("sandbox")}
        label={"Dynamo Sandbox"}
        isActive={app === "sandbox"}
      />
      <TabHeaders
        onClick={() => setApp("revit")}
        label={"Revit"}
        isActive={app === "revit"}
      />
      <br />
      <br />
      {app === "sandbox" ? (
        <>
          <div>
            Follow these directions to install Dynamo Sandbox and FormaDynamo
            extension.
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>1.</div>
            <div>
              Download Dynamo 2.81.0 from{" "}
              <a
                href="https://dyn-builds-data.s3-us-west-2.amazonaws.com/DynamoCoreRuntime2.18.1.zip"
                target="_blank"
              >
                daily builds
              </a>
            </div>
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>2.</div>
            <div>
              Download{" "}
              <a href={"#"} onClick={downloadDynamoPlayerExtension}>
                FormaDynamo.7z
              </a>
            </div>
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>3.</div>
            <div>
              Extract Dynamo 2.18 using{" "}
              <a target="_blank" href={"https://7-zip.org/"}>
                7zip
              </a>{" "}
              to a folder of your choise.
            </div>
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>4.</div>
            <div>
              Extract FormaDynamo.7z to{" "}
              <span style={{ fontFamily: "Monaco" }}>
                %AppData%\Dynamo\Dynamo Core\2.18\packages
              </span>
            </div>
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>5.</div>
            <div>Open DynamoSandbox.exe from the Dynamo 2.18 folder</div>
          </div>
        </>
      ) : (
        <>
          <div>
            Follow these directions to set up Revit and the FormaDynamo
            extension.
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>1.</div>
            <div>
              Make sure you have Revit 2024.1 installed with Dynamo 2.18.1
            </div>
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>2.</div>
            <div>
              Download{" "}
              <a href={"#"} onClick={downloadDynamoPlayerExtension}>
                FormaDynamo.7z
              </a>
            </div>
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>3.</div>
            <div>
              Extract FormaDynamo.7z to{" "}
              <span style={{ fontFamily: "Monaco" }}>
                %AppData%\Dynamo\Dynamo Revit\2.18\packages
              </span>
            </div>
          </div>
          <br />
          <div style={{ display: "flex" }}>
            <div style={{ width: "15px" }}>4.</div>
            <div>Open Dynamo from Revit</div>
          </div>
        </>
      )}
    </div>
  );
}
