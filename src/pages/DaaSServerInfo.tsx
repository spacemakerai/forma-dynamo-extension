import { useEffect, useState } from "preact/hooks";
import { DynamoService, ServerInfo } from "../service/dynamo";

export function DaasServerInfo({ dynamo }: { dynamo: DynamoService }) {
  const [serverInfo, setServerInfo] = useState<ServerInfo | undefined>(undefined);
  useEffect(() => {
    dynamo.serverInfo().then((si) => {
      setServerInfo(si);
    });
  }, [dynamo]);

  return (
    <>
      <h3>Dynamo Info:</h3>
      {serverInfo
        ? Object.entries(serverInfo).map(([key, val]) => (
            <p key={key}>
              {key}: {val}
            </p>
          ))
        : null}
    </>
  );
}
