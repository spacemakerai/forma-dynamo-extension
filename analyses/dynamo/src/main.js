import { h, render } from "https://esm.sh/preact";
import { useState, useCallback, useEffect } from "https://esm.sh/preact/compat";
import htm from "https://esm.sh/htm";
import { download } from "../util/download.js";
import { RunScript } from "./pages/RunScript.js";

const html = htm.bind(h);

function ScriptList({ setScript, setPage }) {
  const [programs, setPrograms] = useState(
    JSON.parse(localStorage.getItem("dynamo-programs") || "{}")
  );

  useEffect(async () => {
    const templates = Object.fromEntries(
      await Promise.all(
        ["Primitives", "ExtrudePolygon"].map(async (name) => [
          name,
          await fetch(`templates/${name}.json`).then((res) => res.text()),
        ])
      )
    );

    setPrograms((programs) => ({ ...programs, ...templates }));
  });

  const update = useCallback(({ name, code }) => {
    setPrograms((programs) => {
      const updated = { ...programs, [name]: code };
      if (!code) {
        delete update[name];
      }
      localStorage.setItem("dynamo-programs", JSON.stringify(updated));
      return updated;
    });
  });

  const deleteProgram = useCallback(
    (name) => {
      update({ name, code: undefined });
    },
    [update]
  );

  const ondrop = useCallback(
    async (ev) => {
      ev.preventDefault();
      if (ev.dataTransfer.items) {
        console.log("datatransferitemlist interface");
        // Use DataTransferItemList interface to access the file(s)
        const files = await Promise.all(
          [...ev.dataTransfer.items].map(async (item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
              const file = item.getAsFile();

              const reader = new FileReader();

              const contentP = new Promise((resolve) =>
                reader.addEventListener(
                  "load",
                  () => {
                    // this will then display a text file
                    resolve(reader.result);
                  },
                  false
                )
              );

              reader.readAsText(file);

              return { name: file.name, code: await contentP };
            }
          })
        );

        files.map(update);
      }
    },
    [update]
  );

  const ondropover = useCallback((e) => {
    e.preventDefault();
  });

  return html`
    <div>
      <h1>Dynamo</h1>

      ${Object.entries(programs).map(
        ([name, code]) => html`
          <div>
            ${name}
            <div>
              <button
                onclick=${() => {
                  setScript({ name, code });
                  setPage("RunScript");
                }}
              >
                Open
              </button>
              <button onclick=${() => download(name, code)}>Download</button>
              <button onclick=${() => deleteProgram(name)}>Delete</button>
            </div>
          </div>
        `
      )}

      <div
        style=${{
          height: "100px",
          border: "1px solid gray",
          margin: "5px",
          padding: "5px",
          borderRadius: "3px",
        }}
        ondrop=${ondrop}
        ondragover=${ondropover}
      >
        > drop your dynamo app here
      </div>
    </div>
  `;
}

function App(props) {
  const [page, setPage] = useState("ScriptList");
  const [script, setScript] = useState({});

  if (page === "ScriptList") {
    return html`<${ScriptList} setPage=${setPage} setScript=${setScript} />`;
  } else if (page === "RunScript") {
    return html`<${RunScript} setPage=${setPage} script=${script} />`;
  } else {
    return html`<div>Not found</div>`;
  }
}

render(html`<${App} />`, document.body);
