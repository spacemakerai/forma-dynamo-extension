import { useCallback, useEffect, useState } from "preact/hooks";
import * as Dynamo from "./service/dynamo.ts";

export enum DynamoConnectionState {
  INIT = "INIT",
  CONNECTED = "CONNECTED",
  MULTIPLE_CONNECTIONS = "MULTIPLE_CONNECTIONS",
  NOT_CONNECTED = "NOT_CONNECTED",
  BLOCKED = "BLOCKED",
  LOST_CONNECTION = "LOST_CONNECTION",
}

export const useDynamoConnector = () => {
  const [state, setState] = useState<DynamoConnectionState>(DynamoConnectionState.INIT);
  const [dynamoPort, setDynamoPort] = useState<number | undefined>(undefined);

  const getDynamoUrl = useCallback(() => {
    return `http://localhost:${dynamoPort}`;
  }, [dynamoPort]);

  const portDiscovery = async () => {
    setDynamoPort(undefined);
    const defaultPort = 55100;

    const defaultHealth = await Dynamo.health(defaultPort);
    if (defaultHealth.status === 200) {
      setState(DynamoConnectionState.CONNECTED);
      setDynamoPort(defaultPort);
      return;
    }

    const portsToCheck = [...Array(10)].map((_, i) => defaultPort + i);
    const responses = await Promise.all(portsToCheck.map((port) => Dynamo.health(port)));
    const connections = responses.filter((response) => response.status === 200);
    if (connections.length === 1) {
      setState(DynamoConnectionState.CONNECTED);
      setDynamoPort(connections[0].port);
    } else if (connections.length > 1) {
      setState(DynamoConnectionState.MULTIPLE_CONNECTIONS);
    } else {
      const blockedConnections = responses.filter((response) => response.status === 503);
      if (blockedConnections.length > 0) {
        setState(DynamoConnectionState.BLOCKED);
      } else {
        setState(DynamoConnectionState.NOT_CONNECTED);
      }
    }
  };

  useEffect(() => {
    if (state === DynamoConnectionState.INIT) {
      portDiscovery();
    }
  }, [state]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (
      [
        DynamoConnectionState.NOT_CONNECTED,
        DynamoConnectionState.MULTIPLE_CONNECTIONS,
        DynamoConnectionState.BLOCKED,
        DynamoConnectionState.LOST_CONNECTION,
      ].includes(state)
    ) {
      // @ts-ignore
      intervalId = setInterval(() => portDiscovery(), 2000);
    }
    return () => clearInterval(intervalId);
  }, [state]);

  const handler = useCallback(
    (method: string, payload: any) => {
      switch (method) {
        case "getFolderInfo":
          return Dynamo.graphFolderInfo(getDynamoUrl(), payload.path).catch((e) => {
            setState(DynamoConnectionState.LOST_CONNECTION);
            throw e;
          });
        case "getGraphInfo":
          return Dynamo.info(getDynamoUrl(), payload.code).catch((e) => {
            if (!(e.status === 500 && e.message === "Graph is not trusted.")) {
              setState(DynamoConnectionState.LOST_CONNECTION);
            }
            throw e;
          });
        case "runGraph":
          // eslint-disable-next-line no-case-declarations
          const { code, inputs } = payload;
          return Dynamo.run(getDynamoUrl(), code, inputs).catch((e) => {
            setState(DynamoConnectionState.LOST_CONNECTION);
            throw e;
          });
        case "trustFolder":
          return Dynamo.trust(getDynamoUrl(), payload.path).catch((e) => {
            setState(DynamoConnectionState.LOST_CONNECTION);
            throw e;
          });
      }
    },
    [getDynamoUrl],
  );
  return { connectionState: state, dynamoHandler: handler };
};
