import { useState } from "preact/hooks";
import { ErrorIcon } from "../../icons/Error";
import { Close } from "../../icons/Close";

export function ErrorBanner({ message, description }: { message: string; description?: string }) {
  const [show, setShow] = useState(true);

  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        borderLeft: "solid 4px red",
        height: description ? "72px" : "48px",
        paddingLeft: "8px",
        paddingTop: "8px",
      }}
    >
      <ErrorIcon />
      <div style={{ paddingLeft: "8px", flexGrow: 1 }}>
        <div style={{ height: "24px", lineHeight: "24px" }}>{message}</div>
        {description && (
          <div style={{ height: "24px", lineHeight: "24px", paddingTop: "8px" }}>{description}</div>
        )}
      </div>

      <div
        style={{
          cursor: "pointer",
          display: "flex",
          width: "36px",
          height: "36px",
          marginRight: "8px",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={() => setShow(!show)}
      >
        <Close />
      </div>
    </div>
  );
}
