import { useCallback, useEffect, useState } from "preact/compat";
import { LocalScript } from "./pages/LocalScript";
import { Next } from "./icons/Next";
import dynamoIconUrn from "./icons/dynamo.png";
import { Forma } from "forma-embedded-view-sdk/auto";
import { DynamoState, useDynamoConnector } from "./DynamoConnector.ts";
import { TemplatesAndLibrary } from "./pages/components/TemplatesAndLibrary.tsx";

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
        const localPrograms = Object.fromEntries(
          localFiles.map((file: any) => [file.name, file]),
        );
        setPrograms(localPrograms);
      } catch (e) {
        setError("Could not load files");
      }
    })();
  }, [folder]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={dynamoIconUrn} />
        <h1
          style={{
            fontFamily: "Artifact Element",
            marginLeft: "5px",
            fontSize: "12px",
          }}
        >
          Dynamo Player
        </h1>
      </div>
      <TemplatesAndLibrary />
      Folder:
      <br />
      <input
        defaultValue={folder}
        onChange={(e: any) => {
          const folder = e?.target?.value;
          localStorage.setItem("dynamo-folder", folder);
          setFolder(folder);
        }}
      />
      {error && (
        <div style={{ color: "red" }}>
          {error}
          <button onClick={reload}>Retry</button>
        </div>
      )}
      {folder ? (
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
      ) : (
        <div>Select trusted Dynamo folder</div>
      )}
    </div>
  );
}

const DynamoStatusPage = ({ dynamoState }: { dynamoState: DynamoState }) => {
  switch (dynamoState) {
    case DynamoState.INIT:
      return <>Loading...</>;
    case DynamoState.NOT_CONNECTED:
      return <>Make sure you have Dynamo running locally on your machine</>;
    case DynamoState.MULTIPLE_CONNECTIONS:
      return (
        <>
          Multiple instances of Dynamo was found running. Close all except one
          instance.
        </>
      );
    case DynamoState.BLOCKED:
      return <>Dynamo is blocked, open Dynamo and follow instructions</>;
    case DynamoState.CONNECTED:
    case DynamoState.LOST_CONNECTION:
      return null;
  }
};

export function App() {
  const { dynamoState, dynamoHandler } = useDynamoConnector();
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
  return <DynamoStatusPage dynamoState={dynamoState} />;
}
