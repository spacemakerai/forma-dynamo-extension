import { useCallback } from "preact/hooks";

export function ErrorPage() {
  const downloadDynamoPlayerExtension = useCallback(() => {
    window.open("./assets/DynamoPlayerExtension.7z", "_blank");
  }, []);

  return (
    <div>
      <h1>Dynamo</h1>
      <div>Failed to call Dynamo</div>

      <div>
        Try these instructions:
        <ol>
          <li>
            Download and extract Dynamo 3.0 from{" "}
            <a
              href="https://dyn-builds-data.s3-us-west-2.amazonaws.com/DynamoCoreRuntime_3.0.0.6366_20230929T1307.zip"
              target="_blank"
            >
              Daily Builds
            </a>
          </li>
          <li>
            Download{" "}
            <button onClick={downloadDynamoPlayerExtension}>
              DynamoPlayerExtension.7z
            </button>
          </li>
          <li>
            Extract DynamoPlayerExtension.7z to '
            {"%AppData%\\Roaming\\Dynamo\\Dynamo Core\\3.0\\packages"}'
          </li>

          <li>Open DynamoSandbox.exe from downloaded Dynamo 3.0</li>
        </ol>
      </div>
    </div>
  );
}

//<li> Extract DynamoPlayerExtension.7z to %AppData%\Roaming\Dynamo\Dynamo Core\3.0\packages </li>
