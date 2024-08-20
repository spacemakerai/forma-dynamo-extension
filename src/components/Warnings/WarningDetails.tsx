import { useCallback, useState } from "preact/hooks";
import { Close } from "../../icons/Close";
import { WarningIcon } from "../../icons/Warning";

export type Warning = {
  id: string;
  title: string;
  description: string;
};

export function WarningDetails({ warnings, close }: { warnings: Warning[]; close: () => void }) {
  const [filter, setFilter] = useState<string>("");

  const criteria = useCallback(
    (issue: Warning) => {
      if (!filter || filter === "") {
        return true;
      }

      if (issue.title.toLowerCase().includes(filter.toLowerCase())) {
        return true;
      }

      if (issue.description.toLowerCase().includes(filter.toLowerCase())) {
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
        {warnings.filter(criteria).map((warning) => (
          <div
            style={{
              margin: "8px 8px",
              padding: "8px 4px",
              display: "flex",
              borderBottom: "solid 1px #E0E0E0",
            }}
            key={warning.id}
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
              <b>{warning.title}</b>
              <div>{warning.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
