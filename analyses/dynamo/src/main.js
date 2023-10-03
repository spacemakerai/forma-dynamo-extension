import { h, render } from "https://esm.sh/preact";
import { useState, useCallback } from "https://esm.sh/preact/compat";
import htm from "https://esm.sh/htm";
import { RunScript } from "./pages/RunScript.js";
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

function App() {
  const [page, setPage] = useState("ScriptList");
  const [script, setScript] = useState({});

  if (page === "ScriptList") {
    return html`<${ScriptList} setPage=${setPage} setScript=${setScript} />`;
  } else if (page === "RunScript" && !!script.code.id) {
    return html`<${LocalScript} setPage=${setPage} script=${script} />`;
  } else if (page === "RunScript") {
    return html`<${RunScript} setPage=${setPage} script=${script} />`;
  } else if (page === "Error") {
    return html`<${ErrorPage} />`;
  } else {
    return html`<div>Not found</div>`;
  }
}

render(html`<${App} />`, document.body);
