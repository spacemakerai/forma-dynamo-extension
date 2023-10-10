import { useState, useCallback, useEffect } from "preact/compat";
import { LocalScript } from "./pages/LocalScript";
import { ErrorPage } from "./pages/ErrorPage";
import { BlockedPage } from "./pages/BlockedPage";
import * as Dynamo from "./service/dynamo";
import { Next } from "./icons/Next";
import dynamoIconUrn from "./icons/dynamo.png";

let dynamoFolder = "";
try {
  dynamoFolder = localStorage.getItem("dynamo-folder") || "";
} catch (e) {
  console.error(e);
}

function ScriptListItem({ name, code, setScript, setPage }: any) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        setScript({ name, code });
        setPage("RunScript");
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

function ScriptList({ setScript, setPage }: any) {
  const [programs, setPrograms] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState(dynamoFolder);

  useEffect(() => {
    (async function () {
      if (!folder) return;

      try {
        setError(null);
        setPrograms([]);
        const localFiles = await Dynamo.graphFolderInfo(folder);

        const localPrograms = Object.fromEntries(
          localFiles.map((file: any) => [file.name, file])
        );
        setPrograms(localPrograms);
      } catch (e) {
        setError("Could not load files");
      }
    })();
  }, [folder]);

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
      {error && <div style={{ color: "red" }}>{error}</div>}
      {folder ? (
        <div>
          {Object.entries(programs).map(([name, code]) => (
            <ScriptListItem
              key={name}
              name={name}
              code={code}
              setScript={setScript}
              setPage={setPage}
            />
          ))}
        </div>
      ) : (
        <div>Select trusted Dynamo folder</div>
      )}
    </div>
  );
}

function useIsDynamoAccessible() {
  const [state, setState] = useState({ state: "INIT" });

  useEffect(() => {
    const intervalId = setInterval(() => {
      (async function () {
        try {
          setState({ state: await Dynamo.health() });
        } catch (e) {
          console.error(e);
          setState({ state: "UNAVAILABLE" });
        }
      })();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return state;
}

export function App() {
  const [page, setPage] = useState("ScriptList");
  const [script, setScript] = useState({});

  const isAccessible = useIsDynamoAccessible();

  if (isAccessible.state === "INIT") {
    return <div>Looking for Dynamo...</div>;
  } else if (isAccessible.state === "UNAVAILABLE") {
    return <ErrorPage />;
  } else if (isAccessible.state === "BLOCKED") {
    return <BlockedPage />;
  }

  if (page === "ScriptList") {
    return <ScriptList setPage={setPage} setScript={setScript} />;
  } else if (page === "RunScript" && !!script?.code?.id) {
    return <LocalScript setPage={setPage} script={script} />;
  } else if (page === "Error") {
    return <ErrorPage />;
  } else {
    return <div>Not found</div>;
  }
}
