import { useState, useCallback, useEffect } from "preact/compat";
import { LocalScript } from "./pages/LocalScript";
import { ErrorPage } from "./pages/ErrorPage";
import * as Dynamo from "./service/dynamo";

let dynamoFolder = "";
try {
  dynamoFolder = localStorage.getItem("dynamo-folder") || "";
} catch (e) {
  console.error(e);
}

function ScriptList({ setScript, setPage }: any) {
  const [programs, setPrograms] = useState(
    JSON.parse(localStorage.getItem("dynamo-programs") || "{}")
  );
  const [folder, setFolder] = useState(dynamoFolder);

  const reload = useCallback(async () => {
    try {
      const localFiles = await Dynamo.graphFolderInfo(folder);

      const localPrograms = Object.fromEntries(
        localFiles.map((file: any) => [file.name, file])
      );
      localStorage.setItem("dynamo-programs", JSON.stringify(localPrograms));
      setPrograms(localPrograms);
    } catch (e) {
      console.error(e);
      setPage("Error");
    }
  }, [folder]);

  return (
    <div>
      <h1>Dynamo</h1>
      Folder:
      <input
        defaultValue={folder}
        onChange={(e: any) => {
          const folder = e?.target?.value;
          localStorage.setItem("dynamo-folder", folder);
          setFolder(folder);
        }}
      />
      {folder ? (
        <div>
          <button onClick={reload}>reload files</button>

          {Object.entries(programs).map(([name, code]) => (
            <div>
              {name}

              <button
                onClick={() => {
                  setScript({ name, code });
                  setPage("RunScript");
                }}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div>Select trusted Dynamo folder</div>
      )}
    </div>
  );
}

function useIsDynamoAccessible() {
  const [state, setState] = useState({ state: "init", health: false });

  useEffect(() => {
    (async function () {
      try {
        setState({ state: "success", health: await Dynamo.health() });
      } catch (e) {
        console.error(e);
        setState({ state: "success", health: false });
      }
    })();
  }, []);

  return state;
}

export function App() {
  const [page, setPage] = useState("ScriptList");
  const [script, setScript] = useState({});

  const isAccessible = useIsDynamoAccessible();

  if (isAccessible.state === "init") {
    return <div>Looking for Dynamo...</div>;
  } else if (isAccessible.state === "success" && !isAccessible.health) {
    return <ErrorPage />;
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
