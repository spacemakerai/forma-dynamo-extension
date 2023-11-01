import { useCallback, useEffect, useState } from "preact/compat";
import { LocalScript } from "./pages/LocalScript";
import { Next } from "./icons/Next";
import dynamoIconUrn from "./icons/dynamo.png";
import { Forma } from "forma-embedded-view-sdk/auto";
import { useDynamoConnector } from "./DynamoConnector.ts";
import { TemplatesAndLibrary } from "./pages/components/TemplatesAndLibrary.tsx";
import { StatusBlock } from "./pages/components/StatusBlock.tsx";

window.Forma = Forma;

let dynamoFolder = "";
try {
  dynamoFolder = localStorage.getItem("dynamo-folder") || "";
} catch (e) {
  console.error(e);
}

function ScriptListItem({ name, code, setScript }: any) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        setScript({ name, code });
      }}
      style={{
        backgroundColor: hover ? "#80808020" : "#fff",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "40px",
        padding: "0 10px",
      }}
    >
      {name}
      {hover && <Next />}
    </div>
  );
}

function ScriptList({ setScript, dynamoHandler }: any) {
  const [programs, setPrograms] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState(dynamoFolder);

  const reload = useCallback(() => {
    (async function () {
      if (!folder) return;

      try {
        setError(null);
        setPrograms([]);
        const localFiles = await dynamoHandler("getFolderInfo", {
          path: folder,
        });
        localStorage.setItem("dynamo-folder", folder);
        const localPrograms = Object.fromEntries(
          localFiles.map((file: any) => [file.name, file])
        );
        setPrograms(localPrograms);
      } catch (e) {
        setError("Could not load files");
      }
    })();
  }, [folder]);

  useEffect(reload, []);

  return (
    <div>
      <TemplatesAndLibrary />
      <div style={{ width: "100%", height: "1px", backgroundColor: "gray" }} />
      <br />
      <div>
        Graph Folder
        <br />
        <input
          defaultValue={folder}
          onBlur={(e: any) => {
            const folder = e?.target?.value;
            setFolder(folder);
          }}
        />
        <button
          style={{
            cursor: "pointer",
            boxShadow: "none",
            color: "white",
            padding: "1px",
            border: "1px solid gray",
            backgroundColor: "blue",
          }}
          onClick={reload}
        >
          Load
        </button>
      </div>
      {error && (
        <div style={{ color: "red" }}>
          {error}
          <button onClick={reload}>Retry</button>
        </div>
      )}
      {folder && (
        <div>
          {Object.entries(programs).map(([name, code]) => (
            <ScriptListItem
              key={name}
              name={name}
              code={code}
              setScript={setScript}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function App() {
  const { dynamoState, dynamoHandler } = {
    dynamoState: "CONNECTED" as DynamoState,
    dynamoHandler: {},
  }; //useDynamoConnector();
  const [script, setScript] = useState(undefined);
  if (dynamoState === "CONNECTED") {
    return (
      <>
        {!script && (
          <ScriptList dynamoHandler={dynamoHandler} setScript={setScript} />
        )}
        {script && (
          <LocalScript
            dynamoHandler={dynamoHandler}
            script={script}
            setScript={setScript}
          />
        )}
      </>
    );
  }
  return <StatusBlock dynamoState={dynamoState} />;
}
