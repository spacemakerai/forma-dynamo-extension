import { useCallback, useEffect, useState } from "preact/compat";
import { Next } from "../icons/Next";
import { SampleFiles } from "../components/SampleFiles.tsx";
import { CurrentOpenGraphPrompt } from "../components/CurrentOpenGraphPrompt.tsx";
import { DynamoService, FolderGraphInfo } from "../service/dynamo.ts";

type SetScript = (script: FolderGraphInfo) => void;

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

function ScriptListItem({ script, setScript }: { script: FolderGraphInfo; setScript: SetScript }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setScript(script)}
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
      {script.name}
      {hover && <Next />}
    </div>
  );
}

export function LocalFileList({
  setScript,
  dynamo,
}: {
  setScript: SetScript;
  dynamo: DynamoService;
}) {
  const [programs, setPrograms] = useState<Record<string, FolderGraphInfo>>({});
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
          setPrograms({});
          const localFiles = await dynamo.folder(folder);
          localStorage.setItem("dynamo-folder", folder);
          const localPrograms = Object.fromEntries(
            localFiles.map((file: any) => [file.name, { type: "FolderGraph", ...file }]),
          );
          setPrograms(localPrograms);
          setIsLoading(false);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          setIsLoading(false);
          setError("Could not load files. Please check the folder name and try to load again.");
        }
      })();
    },
    [dynamo],
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
      <CurrentOpenGraphPrompt dynamo={dynamo as any} setScript={setScript} />

      {error && <div style={{ color: "red" }}>{error}</div>}
      {!folder && <NoFolderEmptyState />}
      {folder && (
        <div>
          {isLoading && <LoadingScriptList />}
          {!isLoading &&
            Object.values(programs).map((script) => (
              <ScriptListItem key={script.id} script={script} setScript={setScript} />
            ))}
          {!isLoading && !error && Object.keys(programs).length === 0 && (
            <div style={{ color: "gray" }}>No graphs found in folder.</div>
          )}
        </div>
      )}
    </div>
  );
}
