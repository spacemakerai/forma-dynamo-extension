import { BlockedView } from "./BlockedView";
import { ErrorView } from "./ErrorView";
import dynamoIconUrn from "../../icons/dynamo.png";

function Loading() {
  return <div style={{ height: "40px" }}>Looking for dynamo</div>;
}

export function StatusBlock({ isAccessible }: any) {
  if (isAccessible.state === "INIT") {
    return <Loading />;
  } else if (isAccessible.state === "UNAVAILABLE") {
    return <ErrorView />;
  } else if (isAccessible.state === "BLOCKED") {
    return <BlockedView />;
  } else {
    return <div style={{ height: "40px" }} />;
  }
}
