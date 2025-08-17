import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { WarningIcon } from "../../icons/Warning";
import { Warning, WarningDetails } from "./WarningDetails";

export function WarningBanner({
  title,
  description,
  warnings,
}: {
  title: string;
  description?: ComponentChildren;
  warnings: Warning[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      {isExpanded && <WarningDetails warnings={warnings} close={() => setIsExpanded(false)} />}
      <div
        style={{
          display: "flex",
          flexDirection: "row",

          borderLeft: "solid 4px #FAA21B",
          cursor: "pointer",
          lineHeight: "24px",
        }}
        onClick={() => setIsExpanded(true)}
      >
        <WarningIcon />
        <div>
          <div>
            <b>{title}</b>
          </div>
          {description ?? <div>{description}</div>}
        </div>
      </div>
    </div>
  );
}
