import { BlockedView } from "./BlockedView";
import { ErrorView } from "./ErrorView";
import { DynamoState } from "../../DynamoConnector.ts";

function Loading() {
  return (
    <div style={{ width: "100%" }}>
      <weave-skeleton-item
        width="90%"
        style={{ marginTop: "5px" }}
      ></weave-skeleton-item>
      <weave-skeleton-item
        width="70%"
        style={{ marginTop: "5px" }}
      ></weave-skeleton-item>
      <weave-skeleton-item
        width="50%"
        style={{ marginTop: "5px" }}
      ></weave-skeleton-item>
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
      return (
        <>
          Multiple instances of Dynamo was found running. Close all except one
          instance.
        </>
      );
    case DynamoState.BLOCKED:
      return <BlockedView />;
    case DynamoState.CONNECTED:
      return null;
  }
}
