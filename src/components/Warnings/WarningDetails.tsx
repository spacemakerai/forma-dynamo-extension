import { useCallback, useState } from "preact/hooks";
import { Close } from "../../icons/Close";
import { WarningIcon } from "../../icons/Warning";
import { Issue } from "../../service/dynamo";

export function WarningDetails({ issues, close }: { issues: Issue[]; close: () => void }) {
  const [filter, setFilter] = useState<string>("");

  const criteria = useCallback(
    (issue: Issue) => {
      if (!filter || filter === "") {
        return true;
      }

      if (issue.message.toLowerCase().includes(filter.toLowerCase())) {
        return true;
      }

      if (issue.nodeName.toLowerCase().includes(filter.toLowerCase())) {
        return true;
      }

      return false;
    },
    [filter],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        left: "0%",
        top: "0%",
        height: "100%",
        width: "calc(100% - 16px)",
        padding: "8px",
        backgroundColor: "white",
        color: "black",
        position: "fixed",
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <h3>Issue Viewer</h3>
        <div
          style={{
            cursor: "pointer",
            width: "42px",
            height: "42px",
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
          }}
          onClick={close}
        >
          <Close />
        </div>
      </div>

      <weave-search-box
        variant="line"
        placeholder="Search"
        onclear={() => setFilter("")}
        // @ts-ignore
        onChange={(e) => console.log(e.detail.value)}
        onInput={(e) => {
          // @ts-ignore
          setFilter(e.detail.value);
        }}
      />

      <div style={{ overflow: "scroll" }}>
        {issues.filter(criteria).map((issue) => (
          <div
            style={{
              margin: "8px 8px",
              padding: "8px 4px",
              display: "flex",
              borderBottom: "solid 1px #E0E0E0",
            }}
            key={issue.nodeId}
          >
            <div
              style={{
                minWidth: "48px",
                minHeight: "48px",
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
              }}
            >
              <WarningIcon />
            </div>
            <div>
              <b>{issue.nodeName}</b>
              <div>{issue.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
