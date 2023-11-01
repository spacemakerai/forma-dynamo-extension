import { useCallback, useState } from "preact/hooks";

import dynamoRevitExtensionUrl from "../../../assets/DynamoPlayerExtension2.18.7z?url";

function TabHeaders({ label, onClick, isActive }: any) {
  return (
    <span
      style={{
        cursor: "pointer",
        margin: "5px",
        borderBottom: isActive ? "2px solid blue" : "2px solid gray",
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
      :warn: Not able to connect to Dynamo.
      <br />
      <br />
      - Are Dynamo and the FormaDynamo extension installed, and is Dynamo
      running? If so, check Dynamo for any open dialogs that may be blocking.
      <br />
      - Dynamo not installed: Follow installation directions below
      <br />
      <br />
      <div style={{ width: "100%", height: "1px", backgroundColor: "gray" }} />
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
          <ol>
            <li>
              1. Download Dynamo 2.81.0 from{" "}
              <a
                href="https://dyn-builds-data.s3-us-west-2.amazonaws.com/DynamoCoreRuntime2.18.1.zip"
                target="_blank"
              >
                daily builds
              </a>
            </li>
            <br />
            <li>
              2. Download{" "}
              <a href={"#"} onClick={downloadDynamoPlayerExtension}>
                FormaDynamo.7z
              </a>
            </li>
            <br />
            <li>
              3. Extract Dynamo 2.18 using <a href={"#"}>7zip</a> to a folder of
              your choise.
            </li>
            <br />
            <li>
              4. Extract FormaDynamo.7z to{" "}
              <span style={{ background: "#80808040", fontFamily: "Monaco" }}>
                %AppData%\Dynamo\Dynamo Core\2.18\packages
              </span>
            </li>
            <br />
            <li>5. Open DynamoSandbox.exe from the Dynamo 2.18 folder</li>
          </ol>
        </>
      ) : (
        <ol>
          <li>
            1. Make sure you have Revit 2024.1 installed with Dynamo 2.18.1
          </li>
          <br />
          <li>
            2. Download{" "}
            <a href={"#"} onClick={downloadDynamoPlayerExtension}>
              FormaDynamo.7z
            </a>
          </li>
          <br />
          <li>
            4. Extract FormaDynamo.7z to{" "}
            <span style={{ background: "#80808040", fontFamily: "Monaco" }}>
              %AppData%\Dynamo\Dynamo Revit\2.18\packages
            </span>
          </li>
          <br />

          <li>4. Open Dynamo from Revit</li>
        </ol>
      )}
    </div>
  );
}
