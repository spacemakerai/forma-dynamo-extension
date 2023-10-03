import { useCallback } from "https://esm.sh/preact/hooks";
import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

export function ErrorPage() {
  const downloadDynamoPlayerExtension = useCallback(() => {
    window.open("./assets/DynamoPlayerExtension.7z", "_blank");
  }, []);

  return html`<div>
    <h1>Dynamo</h1>
    <div>Failed to call Dynamo</div>

    <div>
      Try these instructions:
      <ol>
        <li>
          Download and extract Dynamo 3.0 from${" "}
          <a
            href="https://dyn-builds-data.s3-us-west-2.amazonaws.com/DynamoCoreRuntime_3.0.0.6366_20230929T1307.zip"
            target="_blank"
            >Daily Builds</a
          >
        </li>
        <li>
          Download${" "}
          <a href="#" onClick=${downloadDynamoPlayerExtension}
            >DynamoPlayerExtension.7z</a
          >
        </li>
        <li>
          Extract DynamoPlayerExtension.7z to
          '${"%AppData%\\Roaming\\Dynamo\\Dynamo Core\\3.0\\packages"}'
        </li>

        <li>Open DynamoSandbox.exe from downloaded Dynamo 3.0</li>
      </ol>
    </div>
  </div>`;
}

//<li> Extract DynamoPlayerExtension.7z to %AppData%\Roaming\Dynamo\Dynamo Core\3.0\packages </li>
