import { useCallback, useState, useEffect } from "preact/hooks";
import dynamoIconUrn from "../../icons/dynamo.png";
import dynamoRevitExtensionUrl from "../../../assets/DynamoPlayerExtension2.18.7z?url";

export function ErrorView() {
  const downloadDynamoPlayerExtension = useCallback(() => {
    window.open(dynamoRevitExtensionUrl, "_blank");
  }, []);
  const downloadDynamoPlayerExtensionRevit = useCallback(() => {
    window.open(dynamoRevitExtensionUrl, "_blank");
  }, []);

  const [app, setApp] = useState("sandbox");
  const [expanded, setExpanded] = useState(false);

  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timeout);
  });

  function AnimatedDots() {
    const [dots, setDots] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((dots) => (dots + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }, []);

    return <span>{Array(dots).fill(".").join("")}</span>;
  }

  return (
    <>
      <div style={{ height: "40px" }}>
        {isVisible && (
          <>
            Dynamo not responding (retrying <AnimatedDots />)
            <button onClick={() => setExpanded(!expanded)}>More</button>
          </>
        )}
      </div>
      {expanded && (
        <div>
          This can either be because Dynamo is <b>busy</b>, or because Dynamo is
          not installed.
          <br />
          <br />
          <button onClick={() => setApp("sandbox")}>Dynamo Sandbox</button>
          <button onClick={() => setApp("revit")}>Revit</button>
          <br />
          Install dynamo with these instructions:
          <br />
          <br />
          {app === "sandbox" ? (
            <ol>
              <li>
                1. Download and extract Dynamo 2.81.0 from{" "}
                <a
                  href="https://dyn-builds-data.s3-us-west-2.amazonaws.com/DynamoCoreRuntime2.18.1.zip"
                  target="_blank"
                >
                  Daily Builds
                </a>
              </li>
              <br />
              <li>
                2. Download{" "}
                <button onClick={downloadDynamoPlayerExtension}>
                  DynamoPlayerExtension2.18.7z
                </button>
              </li>
              <br />
              <li>
                3. Extract DynamoPlayerExtension2.18.7z to{" "}
                <span style={{ background: "#80808040", fontFamily: "Monaco" }}>
                  %AppData%\Dynamo\Dynamo Core\2.18\packages
                </span>
              </li>
              <br />

              <li>4. Open DynamoSandbox.exe from downloaded Dynamo 2.18</li>
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
                  %AppData%\Dynamo\Dynamo Revit\2.18\packages
                </span>
              </li>
              <br />

              <li>4. Open Dynamo from Revit</li>
            </ol>
          )}
        </div>
      )}
    </>
  );
}
