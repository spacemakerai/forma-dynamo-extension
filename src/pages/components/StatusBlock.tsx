import { BlockedView } from "./BlockedView";
import { ErrorView } from "./ErrorView";
import { DynamoState } from "../../DynamoConnector.ts";

function Loading() {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontSize: "12px", padding: "16px 0" }}>Connecting to Dynamo...</div>
      <weave-progress-bar />
    </div>
  );
}

export function StatusBlock({ dynamoState }: { dynamoState: DynamoState }) {
  switch (dynamoState) {
    case DynamoState.INIT:
    case DynamoState.LOST_CONNECTION:
      return <Loading />;
    case DynamoState.NOT_CONNECTED:
      return <ErrorView />;
    case DynamoState.MULTIPLE_CONNECTIONS:
      return <>Multiple instances of Dynamo was found running. Close all except one instance.</>;
    case DynamoState.BLOCKED:
      return <BlockedView />;
    case DynamoState.CONNECTED:
      return null;
  }
}
