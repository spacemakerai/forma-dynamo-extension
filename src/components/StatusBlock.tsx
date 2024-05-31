import { BlockedView } from "./BlockedView";
import { ErrorView } from "./ErrorView";
import { DynamoConnectionState } from "../DynamoConnector.ts";

function Loading() {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontSize: "12px", padding: "16px 0" }}>Connecting to Dynamo...</div>
      <weave-progress-bar />
    </div>
  );
}

export function StatusBlock({ connectionState }: { connectionState: DynamoConnectionState }) {
  switch (connectionState) {
    case DynamoConnectionState.INIT:
    case DynamoConnectionState.LOST_CONNECTION:
      return <Loading />;
    case DynamoConnectionState.NOT_CONNECTED:
      return <ErrorView />;
    case DynamoConnectionState.MULTIPLE_CONNECTIONS:
      return <>Multiple instances of Dynamo was found running. Close all except one instance.</>;
    case DynamoConnectionState.BLOCKED:
      return <BlockedView />;
    case DynamoConnectionState.CONNECTED:
      return null;
  }
}
