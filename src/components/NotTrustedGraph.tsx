import { useCallback } from "preact/hooks";

export function NotTrustedGraph({ script, setScript, reload, dynamoHandler }: any) {
  const trust = useCallback(async () => {
    const { id } = script.code;

    const parts = id.split("\\");
    parts.pop();

    await dynamoHandler("trustFolder", { path: parts.join("\\") });
    reload();
  }, [script.code, dynamoHandler, reload]);

  return (
    <div>
      <h3>Open external file?</h3>
      <div style={{ lineHeight: "20px" }}>
        This file is stored in an untrusted location.
        <br />
        Do you want to trust this file´s location?
      </div>
      <div
        style={{
          marginTop: "12px",
        }}
      >
        <weave-button
          style={{ marginRight: "6px" }}
          variant="outlined"
          onClick={() => setScript(undefined)}
        >
          No, go back
        </weave-button>
        <weave-button variant="solid" onClick={trust}>
          Yes, trust location
        </weave-button>
      </div>
    </div>
  );
}
