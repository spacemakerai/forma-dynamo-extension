import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import {
  default as Dynamo,
  DynamoService,
  GraphInfo,
  GraphTarget,
  RunInputs,
} from "./service/dynamo.ts";

export enum DynamoConnectionState {
  INIT = "INIT",
  CONNECTED = "CONNECTED",
  MULTIPLE_CONNECTIONS = "MULTIPLE_CONNECTIONS",
  NOT_CONNECTED = "NOT_CONNECTED",
  BLOCKED = "BLOCKED",
  LOST_CONNECTION = "LOST_CONNECTION",
}

type DynamoState = {
  currentOpenGraph?: GraphInfo;
  connectionState: DynamoConnectionState;
};

export const useDynamoConnector = () => {
  const [state, setState] = useState<DynamoState>({ connectionState: DynamoConnectionState.INIT });
  const [dynamoPort, setDynamoPort] = useState<number | undefined>(undefined);

  const getDynamoUrl = useCallback(() => {
    return `http://localhost:${dynamoPort}`;
  }, [dynamoPort]);

  const portDiscovery = async () => {
    setDynamoPort(undefined);
    const defaultPort = 55100;

    const defaultHealth = await Dynamo.health(defaultPort);
    if (defaultHealth.status === 200) {
      setState((state) => ({ ...state, connectionState: DynamoConnectionState.CONNECTED }));
      setDynamoPort(defaultPort);
      return;
    }

    const portsToCheck = [...Array(10)].map((_, i) => defaultPort + i);
    const responses = await Promise.all(portsToCheck.map((port) => Dynamo.health(port)));
    const connections = responses.filter((response) => response.status === 200);
    if (connections.length === 1) {
      setState((state) => ({ ...state, connectionState: DynamoConnectionState.CONNECTED }));
      setDynamoPort(connections[0].port);
    } else if (connections.length > 1) {
      setState((state) => ({
        ...state,
        connectionState: DynamoConnectionState.MULTIPLE_CONNECTIONS,
      }));
    } else {
      const blockedConnections = responses.filter((response) => response.status === 503);
      if (blockedConnections.length > 0) {
        setState((state) => ({ ...state, connectionState: DynamoConnectionState.BLOCKED }));
      } else {
        setState((state) => ({ ...state, connectionState: DynamoConnectionState.NOT_CONNECTED }));
      }
    }
  };

  useEffect(() => {
    if (state.connectionState === DynamoConnectionState.INIT) {
      portDiscovery();
    }
  }, [state.connectionState]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (
      [
        DynamoConnectionState.NOT_CONNECTED,
        DynamoConnectionState.MULTIPLE_CONNECTIONS,
        DynamoConnectionState.BLOCKED,
        DynamoConnectionState.LOST_CONNECTION,
      ].includes(state.connectionState)
    ) {
      // @ts-ignore
      intervalId = setInterval(() => portDiscovery(), 2000);
    }
    return () => clearInterval(intervalId);
  }, [state.connectionState]);

  const dynamoLocalService: DynamoService = useMemo(() => {
    const url = getDynamoUrl();

    const dynamo = new Dynamo(url);

    return {
      folder: (path: string) => {
        console.log("folder");
        return dynamo.folder(path).catch((e) => {
          console.log("folder", e);
          setState((state) => ({
            ...state,
            connectionState: DynamoConnectionState.LOST_CONNECTION,
          }));
          throw e;
        });
      },
      current: () => {
        console.log("current");
        return dynamo.info({ type: "CurrentGraphTarget" });
      },
      info: (target: GraphTarget) => {
        console.log("info");
        return dynamo.info(target).catch((e) => {
          if (!(e.status === 500 && e.message === "Graph is not trusted.")) {
            console.log("info", e);
            setState((state) => ({
              ...state,
              connectionState: DynamoConnectionState.LOST_CONNECTION,
            }));
          }
          throw e;
        });
      },
      run: (target: GraphTarget, inputs: RunInputs) => {
        console.log("run");
        return dynamo.run(target, inputs).catch((e) => {
          console.log("run", e);
          setState((state) => ({
            ...state,
            connectionState: DynamoConnectionState.LOST_CONNECTION,
          }));
          throw e;
        });
      },
      trust: (path: string) => {
        console.log("trust");
        return dynamo.trust(path).catch((e) => {
          console.log("trust", e);
          setState((state) => ({
            ...state,
            connectionState: DynamoConnectionState.LOST_CONNECTION,
          }));
          throw e;
        });
      },
      health: (port: number) => {
        return Dynamo.health(port);
      },
    };
  }, [getDynamoUrl]);

  return { state, dynamo: dynamoLocalService };
};
