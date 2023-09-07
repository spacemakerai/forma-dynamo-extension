import { Forma } from "https://esm.sh/forma-embedded-view-sdk/auto";
import { h, render } from "https://esm.sh/preact";
import { useState, useCallback, useEffect } from "https://esm.sh/preact/compat";
import htm from "https://esm.sh/htm";
import { generateGeometry } from "./service/render.js";
import { download } from "./util/download.js";
import * as template from "./templates/template.js";
import { callDynamo } from "./service/dynamo.js";
import {
  getConstraints,
  getProposal,
  getSurroundings,
} from "./util/geometry.js";

const html = htm.bind(h);

async function runProgram(url, code) {
  const result = await callDynamo(url, code);

  console.log(result.info);

  if (result.geometry) {
    for (const geometry of result.geometry) {
      for (const entry of geometry.geometryEntries) {
        const geometryData = await generateGeometry(entry);

        if (geometryData) {
          await Forma.render.updateMesh({
            id: geometry.id,
            geometryData,
          });
        }
      }
    }
  }
}

function App(props) {
  const [url, setUrl] = useState(localStorage.getItem("dynamo-url") || null);

  const onChange = useCallback((e) => {
    const { value } = e.target;
    localStorage.setItem("dynamo-url", value);
    setUrl(value);
  });

  const [programs, setPrograms] = useState(
    JSON.parse(localStorage.getItem("dynamo-programs") || "{}")
  );

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

      <input defaultValue=${url} onchange=${onChange} />

      <button
        onclick=${async () =>
          download(
            "Constraints",
            template.render(
              await getProposal(),
              await getConstraints(),
              await getSurroundings()
            )
          )}
      >
        Download Constraints template
      </button>

      ${Object.entries(programs).map(
        ([name, code]) => html`
          <div>
            ${name}
            <button onclick=${() => download(name, code)}>Download</button>
            <button onclick=${() => deleteProgram(name)}>Delete</button>
            <button onclick=${() => runProgram(url, code)}>Run</button>
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

render(html`<${App} />`, document.body);
