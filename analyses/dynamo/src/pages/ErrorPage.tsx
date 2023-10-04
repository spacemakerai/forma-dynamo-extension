import { useCallback, useState } from "preact/hooks";

export function ErrorPage() {
  const downloadDynamoPlayerExtension = useCallback(() => {
    window.open("./assets/DynamoPlayerExtension3.0.7.7z", "_blank");
  }, []);
  const downloadDynamoPlayerExtensionRevit = useCallback(() => {
    window.open("./assets/DynamoPlayerPackage2.18.7z", "_blank");
  }, []);

  const [app, setApp] = useState("sandbox");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src="src/icons/dynamo.png" />
        <h1
          style={{
            fontFamily: "Artifact Element",
            marginLeft: "5px",
            fontSize: "12px",
          }}
        >
          Dynamo Player
        </h1>
      </div>
      <div>Failed to call Dynamo</div>

      <div>
        <br />
        <button onClick={() => setApp("sandbox")}>Dynamo Sandbox</button>
        <button onClick={() => setApp("revit")}>Revit</button>
        <br />
        Try these instructions:
        <br />
        <br />
        {app === "sandbox" ? (
          <ol>
            <li>
              1. Download and extract Dynamo 3.0 from{" "}
              <a
                href="https://dyn-builds-data.s3-us-west-2.amazonaws.com/DynamoCoreRuntime_3.0.0.6366_20230929T1307.zip"
                target="_blank"
              >
                Daily Builds
              </a>
            </li>
            <br />
            <li>
              2. Download{" "}
              <button onClick={downloadDynamoPlayerExtension}>
                DynamoPlayerExtension3.0.7.7z
              </button>
            </li>
            <br />
            <li>
              3. Extract DynamoPlayerExtension3.0.7.7z to{" "}
              <span style={{ background: "#80808040", fontFamily: "Monaco" }}>
                %AppData%\Roaming\Dynamo\Dynamo Core\3.0\packages
              </span>
            </li>
            <br />

            <li>4. Open DynamoSandbox.exe from downloaded Dynamo 3.0</li>
          </ol>
        ) : (
          <ol>
            <li>
              1. Make sure you have Revit 2024.1 installed with Dynamo 2.18.1
            </li>
            <br />
            <li>
              2. Download{" "}
              <button onClick={downloadDynamoPlayerExtensionRevit}>
                DynamoPlayerPackage2.18.7z
              </button>
            </li>
            <br />
            <li>
              3. Extract DynamoPlayerPackage2.18.7z to{" "}
              <span style={{ background: "#80808040", fontFamily: "Monaco" }}>
                %AppData%\Roaming\Dynamo\Dynamo Revit\2.18\packages
              </span>
            </li>
            <br />

            <li>4. Open Dynamo from Revit</li>
          </ol>
        )}
      </div>
    </div>
  );
}

//<li> Extract DynamoPlayerExtension.7z to %AppData%\Roaming\Dynamo\Dynamo Core\3.0\packages </li>
