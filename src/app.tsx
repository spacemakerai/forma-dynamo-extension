import { useCallback, useEffect, useState } from "preact/compat";
import { LocalScript } from "./pages/LocalScript";
import { Next } from "./icons/Next";
import { useDynamoConnector } from "./DynamoConnector.ts";
import { SampleFiles } from "./pages/components/SampleFiles.tsx";
import { StatusBlock } from "./pages/components/StatusBlock.tsx";

function LoadingScriptList() {
  return (
    <div style={{ width: "100%" }}>
      {[...Array(3)].map(() => {
        return (
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "40px",
              alignItems: "center",
            }}
          >
            <weave-skeleton-item height="30px"></weave-skeleton-item>
          </div>
        );
      })}
    </div>
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

  useEffect(() => {
    if (!folder) {
      const dynamoFolder = localStorage.getItem("dynamo-folder");
      if (dynamoFolder) {
        setFolder(dynamoFolder);
        reload(dynamoFolder);
      }
    }
  }, []);

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
          setError(
            "Could not load files. Please check the folder name and try to load again.",
          );
        }
      })();
    },
    [folder],
  );

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
        ></weave-input>

        <weave-button variant="solid" onClick={() => reload(folder)}>
          Load
        </weave-button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {folder && (
        <div>
          {isLoading && <LoadingScriptList />}
          {!isLoading &&
            Object.entries(programs).map(([name, code]) => (
              <ScriptListItem
                key={name}
                name={name}
                code={code}
                setScript={setScript}
              />
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
  const { dynamoState, dynamoHandler } = useDynamoConnector();
  const [script, setScript] = useState(undefined);
  if (dynamoState === "CONNECTED") {
    return (
      <div style={{ padding: "0 2px", height: "100%" }}>
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
      </div>
    );
  }
  return <StatusBlock dynamoState={dynamoState} />;
}
