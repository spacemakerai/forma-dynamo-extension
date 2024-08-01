import { useState } from "preact/hooks";
import { WarningIcon } from "../../icons/Warning";
import { Issue } from "../../service/dynamo";
import { WarningDetails } from "./WarningDetails";

export function WarningBanner({ issues }: { issues: Issue[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded && <WarningDetails issues={issues} />}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "24px",
          borderLeft: "solid 4px #FAA21B",
          cursor: "pointer",
          lineHeight: "24px",
        }}
      >
        <WarningIcon />
        The graph returned with warnings or errors.
      </div>
    </div>
  );
}
