import { useCallback, useEffect, useState } from "preact/compat";
import { LocalScript } from "./pages/LocalScript";
import { Next } from "./icons/Next";
import { useDynamoConnector } from "./DynamoConnector.ts";
import { SampleFiles } from "./components/SampleFiles.tsx";
import { StatusBlock } from "./components/StatusBlock.tsx";

function CurrentOpenGraphPrompt({ dynamoHandler, setScript }: any) {
  const [suggestOpenGraph, setSuggestOpenGraph] = useState<any>(null);
  const [isClosed, setIsClosed] = useState(false);

  const currentFolder = localStorage.getItem("dynamo-folder");

  useEffect(() => {
    function handler() {
      dynamoHandler("getCurrentGraphInfo", {})
        .then((currentGraph: any) => {
          if (currentGraph && currentGraph.id) {
            setSuggestOpenGraph(currentGraph);
          }
        })
        .catch((e: Error) => {
          console.error(e);
        });
    }

    const internval = setInterval(handler, 1000);

    return () => clearInterval(internval);
  }, [dynamoHandler]);

  const onOpenGraph = useCallback(() => {
    setScript({ name: suggestOpenGraph.name, code: suggestOpenGraph });
    const file = suggestOpenGraph.id.replaceAll("\\\\", "\\");
    const folder = file.split("\\").slice(0, -1).join("\\");

    if (!currentFolder) {
      localStorage.setItem("dynamo-folder", folder);
    }
  }, [setScript, suggestOpenGraph, currentFolder]);

  if (suggestOpenGraph && !isClosed) {
    return (
      <div
        style={{
          position: "fixed",
          width: "calc(100% - 74px)",
          margin: "10px",
          padding: "25px",
          height: "60px",
          ...(currentFolder ? { bottom: "20px" } : { top: "20px" }),
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "5px",
          textAlign: "center",
        }}
      >
        '{suggestOpenGraph.name}' is currently open in Dynamo.
        <br />
        <br />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <weave-button onClick={() => setIsClosed(true)}>Dismiss</weave-button>
          <weave-button variant="solid" onClick={onOpenGraph}>
            Open
          </weave-button>
        </div>
      </div>
    );
  }
  return null;
}

function LoadingScriptList() {
  return (
    <div style={{ width: "100%" }}>
      {[...Array(3)].map((_, i) => {
        return (
          <div
            key={i}
            style={{
              display: "flex",
              width: "100%",
              height: "40px",
              alignItems: "center",
            }}
          >
            <weave-skeleton-item height="30px" />
          </div>
        );
      })}
    </div>
  );
}

function NoFolderEmptyState() {
  return (
    <>
      <br />
      <br />
      <div>Follow these directions to get started.</div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>1.</div>
        <div>
          Open a Dynamo script in the open Dynamo Application. You can download a sample above.
        </div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>2.</div>
        <div>
          Copy the directory path of the script from the File Explorer and paste it into the folder
          input above.
        </div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>3.</div>
        <div>Click the load button to open the folder.</div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div style={{ width: "15px" }}>4.</div>
        <div>Click on the script to open it in the Dynamo Player.</div>
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <div>
          If you get stuck, check out{" "}
          <a target="_blank" rel="noreferrer" href="https://www.youtube.com/watch?v=Fmpiq6IkpTk">
            this short video
          </a>
          .
        </div>
      </div>
    </>
  );
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
  const [folder, setFolder] = useState<undefined | string>();
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(
    (folder: string | undefined) => {
      (async function () {
        if (!folder) return;
        setIsLoading(true);
        try {
          setError(null);
          setPrograms([]);
          const localFiles = await dynamoHandler("getFolderInfo", {
            path: folder,
          });
          localStorage.setItem("dynamo-folder", folder);
          const localPrograms = Object.fromEntries(
            localFiles.map((file: any) => [file.name, file]),
          );
          setPrograms(localPrograms);
          setIsLoading(false);
        } catch (e) {
          setIsLoading(false);
          setError("Could not load files. Please check the folder name and try to load again.");
        }
      })();
    },
    [dynamoHandler],
  );

  useEffect(() => {
    if (!folder) {
      const dynamoFolder = localStorage.getItem("dynamo-folder");
      if (dynamoFolder) {
        setFolder(dynamoFolder);
        reload(dynamoFolder);
      }
    }
  }, [folder, reload]);

  return (
    <div>
      <SampleFiles />
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "var(--divider-lightweight)",
        }}
      />
      <br />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          marginBottom: "10px",
        }}
      >
        <weave-input
          style={{ flexGrow: 1, marginRight: "5px" }}
          type="text"
          value={folder}
          label="Graph folder"
          title={folder}
          showlabel="true"
          name="height"
          placeholder="Enter folder name"
          onBlur={(e: any) => {
            const folder = e?.target?.value;
            setFolder(folder);
          }}
        />

        <weave-button variant="solid" onClick={() => reload(folder)}>
          Load
        </weave-button>
      </div>
      <CurrentOpenGraphPrompt dynamoHandler={dynamoHandler} setScript={setScript} />

      {error && <div style={{ color: "red" }}>{error}</div>}
      {!folder && <NoFolderEmptyState />}
      {folder && (
        <div>
          {isLoading && <LoadingScriptList />}
          {!isLoading &&
            Object.entries(programs).map(([name, code]) => (
              <ScriptListItem key={name} name={name} code={code} setScript={setScript} />
            ))}
          {!isLoading && !error && Object.keys(programs).length === 0 && (
            <div style={{ color: "gray" }}>No graphs found in folder.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function App() {
  const { state, dynamoHandler } = useDynamoConnector();
  const [script, setScript] = useState(undefined);

  if (state.connectionState === "CONNECTED") {
    return (
      <div style={{ padding: "0 2px", height: "100%" }}>
        {!script && <ScriptList dynamoHandler={dynamoHandler} setScript={setScript} />}
        {script && (
          <LocalScript dynamoHandler={dynamoHandler} script={script} setScript={setScript} />
        )}
      </div>
    );
  }
  return <StatusBlock connectionState={state.connectionState} />;
}
