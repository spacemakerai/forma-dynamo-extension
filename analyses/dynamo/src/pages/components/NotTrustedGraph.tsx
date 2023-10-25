import { useCallback } from "preact/hooks";

export function NotTrustedGraph({ script, reload, dynamoHandler }: any) {
  const trust = useCallback(async () => {
    const { id } = script.code;

    const parts = id.split("\\");
    parts.pop();

    await dynamoHandler("trustFolder", { path: parts.join("\\") });
    reload();
  }, [script, reload]);

  return (
    <div>
      Location of script is not trusted.
      <button onClick={trust}>Trust location</button>
    </div>
  );
}
