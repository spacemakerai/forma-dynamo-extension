import { BlockedView } from "./BlockedView";
import { ErrorView } from "./ErrorView";
import { DynamoState } from "../../DynamoConnector.ts";

function Loading() {
  return <div style={{ height: "40px" }}>Looking for dynamo</div>;
}

export function StatusBlock({ dynamoState }: { dynamoState: DynamoState }) {
  switch (dynamoState) {
    case DynamoState.INIT:
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
    case DynamoState.LOST_CONNECTION:
      return null;
  }
}
