import { Issue } from "../../service/dynamo";

export function WarningDetails({ issues }: { issues: Issue[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "8px",
        left: "5%",
        top: "5%",
        height: "85%",
        width: "85%",
        cursor: "pointer",
        backgroundColor: "white",
        color: "black",
        position: "absolute",
        border: "1px solid #ccc",
        borderRadius: "5px",
        zIndex: 1,
      }}
    >
      <h2>Issues</h2>
      The graph has the following issues.
      <div style={{ overflow: "scroll" }}>
        {issues.map((issue) => (
          <div style={{ paddingTop: "20px" }} key={issue.nodeId}>
            <div>
              <b>Node Name: </b> {issue.nodeName}
            </div>
            <div>
              <b>Node Id: </b> {issue.nodeId}
            </div>
            <div>
              <b>Type: </b> {issue.type}
            </div>
            <div>
              <b>Message:</b> {issue.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
