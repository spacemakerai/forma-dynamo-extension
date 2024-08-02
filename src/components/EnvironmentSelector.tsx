import { useCallback, useState } from "preact/hooks";
import { Caret } from "../icons/Caret";
import { createRef } from "preact";

export function EnvironmentSelector({
  setEnv,
  env,
}: {
  setEnv: (env: "daas" | "local") => void;
  env: "daas" | "local";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popover = createRef();
  const button = createRef();

  const updatePosition = useCallback(
    function () {
      const rect = button.current.getBoundingClientRect();

      const { top } = rect;

      popover.current.style.top = `${top - 80 - 8}px`;
    },
    [button, popover],
  );

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        ref={popover}
        id="environment-selector"
        style={{
          position: "fixed",
          borderRadius: "5px",
          padding: "10px",
          right: "4px",
          width: "140px",
          height: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          background: "white",
          zIndex: 2,
          visibility: isOpen ? "visible" : "hidden",
        }}
      >
        <b>Run in</b>
        <weave-radio-button-group
          onChange={(e) => setEnv((e.target as HTMLInputElement).value as "daas" | "local")}
        >
          <weave-radio-button
            style={{ margin: "2px 0", cursor: "pointer" }}
            name="environment"
            value="daas"
            label="Service (DaaS)"
            checked={env === "daas"}
          />
          <weave-radio-button
            style={{ margin: "2px 0", cursor: "pointer" }}
            name="environment"
            value="local"
            label="Dynamo on Desktop"
            checked={env === "local"}
          />
        </weave-radio-button-group>
      </div>

      <weave-button
        variant="solid"
        ref={button}
        style={{ width: "26px", marginRight: "4px" }}
        onClick={(e) => {
          const btn = e.target;
          if (btn) {
            setIsOpen(!isOpen);
            updatePosition();
          }
        }}
      >
        <Caret />
      </weave-button>
    </>
  );
}
