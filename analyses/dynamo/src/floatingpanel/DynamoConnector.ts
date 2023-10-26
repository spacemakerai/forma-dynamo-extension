import { useCallback, useEffect, useState } from "preact/hooks";
import * as Dynamo from "./service/dynamo.ts";
import { graphFolderInfo } from "./service/dynamo.ts";

export enum DynamoState {
  INIT = "INIT",
  CONNECTED = "CONNECTED",
  MULTIPLE_CONNECTIONS = "MULTIPLE_CONNECTIONS",
  NOT_CONNECTED = "NOT_CONNECTED",
  BLOCKED = "BLOCKED",
  LOST_CONNECTION = "LOST_CONNECTION",
}

async function health(port: number) {
  try {
    const response = await fetch("http://localhost:" + port + "/v1/health");
    if (response.status === 200) {
      return { status: 200, port };
    }
    // TODO: make sure 503 errors end up here
    else if (response.status === 503) {
      return { status: 503, port };
    } else {
      return { status: 500, port };
    }
  } catch (e) {
    return { status: 500, port };
  }
}

export const useDynamoConnector = () => {
  const [state, setState] = useState<DynamoState>(DynamoState.INIT);
  const [dynamoPort, setDynamoPort] = useState<number | undefined>(undefined);

  const getDynamoUrl = () => {
    return "http://localhost:" + dynamoPort;
  };

  const portDiscovery = async () => {
    setDynamoPort(undefined);
    const defaultPort = 55100;
    const portsToCheck = [...Array(10)].map((_, i) => defaultPort + i);
    const responses = await Promise.all(
      portsToCheck.map((port) => health(port)),
    );
    const connections = responses.filter((response) => response.status === 200);
    if (connections.length === 1) {
      setState(DynamoState.CONNECTED);
      setDynamoPort(connections[0].port);
    } else if (connections.length > 1) {
      setState(DynamoState.MULTIPLE_CONNECTIONS);
    } else {
      const blockedConnections = responses.filter(
        (response) => response.status === 503,
      );
      if (blockedConnections.length > 0) {
        setState(DynamoState.BLOCKED);
      }
      setState(DynamoState.NOT_CONNECTED);
    }
  };

  useEffect(() => {
    if (state === DynamoState.INIT) {
      portDiscovery();
    }
  }, [state]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (
      [
        DynamoState.NOT_CONNECTED,
        DynamoState.MULTIPLE_CONNECTIONS,
        DynamoState.BLOCKED,
        DynamoState.LOST_CONNECTION,
      ].includes(state)
    ) {
      intervalId = setInterval(() => portDiscovery(), 2000);
    }
    return () => clearInterval(intervalId);
  }, [state]);

  const handler = useCallback(
    (method: string, payload: any) => {
      switch (method) {
        case "getFolderInfo":
          return graphFolderInfo(getDynamoUrl(), payload.path).catch((e) => {
            setState(DynamoState.LOST_CONNECTION);
            throw e;
          });
        case "getGraphInfo":
          return Dynamo.info(getDynamoUrl(), payload.code).catch((e) => {
            if (!(e.status === 500 && e.message === "Graph is not trusted.")) {
              setState(DynamoState.LOST_CONNECTION);
            }
            throw e;
          });
        case "runGraph":
          const { code, inputs } = payload;
          return Dynamo.run(getDynamoUrl(), code, inputs).catch((e) => {
            setState(DynamoState.LOST_CONNECTION);
            throw e;
          });
        case "trustFolder":
          Dynamo.trust(getDynamoUrl(), payload.path).catch((e) => {
            setState(DynamoState.LOST_CONNECTION);
            throw e;
          });
      }
    },
    [state, dynamoPort],
  );
  return { dynamoState: state, dynamoHandler: handler };
};
