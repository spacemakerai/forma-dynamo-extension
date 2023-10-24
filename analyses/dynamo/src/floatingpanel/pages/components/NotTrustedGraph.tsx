import { useCallback } from "preact/hooks";
import * as Dynamo from "../../service/dynamo";

export function NotTrustedGraph({ script, reload }: any) {
  const trust = useCallback(async () => {
    const { id } = script.code;

    const parts = id.split("\\");
    parts.pop();

    await Dynamo.trust(parts.join("\\"));
    reload();
  }, [script, reload]);

  return (
    <div>
      Location of script is not trusted.
      <button onClick={trust}>Trust location</button>
    </div>
  );
}
