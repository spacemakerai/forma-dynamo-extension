import { h, render } from "https://esm.sh/preact";
import { useState, useCallback, useEffect } from "https://esm.sh/preact/compat";
import htm from "https://esm.sh/htm";
import { LocalScript } from "./pages/LocalScript.js";
import { ErrorPage } from "./pages/ErrorPage.js";
import * as Dynamo from "./service/dynamo.js";

const html = htm.bind(h);

let storedProgram = {};
try {
  storedProgram = JSON.parse(localStorage.getItem("dynamo-program") || "{}");
} catch (e) {
  console.error(e);
}

let dynamoFolder = "";
try {
  dynamoFolder = localStorage.getItem("dynamo-folder") || "";
} catch (e) {
  console.error(e);
}

function ScriptList({ setScript, setPage }) {
  const [programs, setPrograms] = useState(
    JSON.parse(localStorage.getItem("dynamo-programs") || "{}")
  );
  const [folder, setFolder] = useState(dynamoFolder);

  const reload = useCallback(async () => {
    try {
      const localFiles = await Dynamo.graphFolderInfo(folder);

      const localPrograms = Object.fromEntries(
        localFiles.map((file) => [file.name, file])
      );
      setPrograms((programs) => {
        const newPrograms = { ...programs, ...localPrograms };
        localStorage.setItem("dynamo-programs", JSON.stringify(newPrograms));
        return newPrograms;
      });
    } catch (e) {
      console.error(e);
      setPage("Error");
    }
  }, [folder]);

  return html`
    <div>
      <h1>Dynamo</h1>

      Folder:
      <input
        defaultValue=${folder}
        onChange=${(e) => {
          const folder = e.target.value;
          localStorage.setItem("dynamo-folder", folder);
          setFolder(folder);
        }}
      />
      ${folder
        ? html`
            <button onClick=${reload}>reload files</button>

            ${Object.entries(programs).map(
              ([name, code]) => html`
                <div>
                  ${name}

                  <button
                    onclick=${() => {
                      setScript({ name, code });
                      setPage("RunScript");
                    }}
                  >
                    Open
                  </button>
                </div>
              `
            )}
          `
        : html`<div>Select trusted Dynamo folder</div>`}
    </div>
  `;
}

function useIsDynamoAccessible() {
  const [state, setState] = useState({ state: "init" });

  useEffect(async () => {
    try {
      setState({ state: "success", health: await Dynamo.health() });
    } catch (e) {
      console.error(e);
      setState({ state: "success", health: false });
    }
  }, []);

  return state;
}

function App() {
  const [page, setPage] = useState("ScriptList");
  const [script, setScript] = useState({});

  const isAccessible = useIsDynamoAccessible();

  if (isAccessible.state === "init") {
    return html`<div>Looking for Dynamo...</div>`;
  } else if (isAccessible.state === "success" && !isAccessible.health) {
    return html`<${ErrorPage} />`;
  }

  if (page === "ScriptList") {
    return html`<${ScriptList} setPage=${setPage} setScript=${setScript} />`;
  } else if (page === "RunScript" && !!script.code.id) {
    return html`<${LocalScript} setPage=${setPage} script=${script} />`;
  } else if (page === "Error") {
    return html`<${ErrorPage} />`;
  } else {
    return html`<div>Not found</div>`;
  }
}

render(html`<${App} />`, document.body);
