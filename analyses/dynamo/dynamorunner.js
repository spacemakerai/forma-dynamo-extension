import { Forma } from "https://esm.sh/forma-embedded-view-sdk/auto";

import { h, render } from "https://esm.sh/preact";
import { useState, useCallback, useEffect } from "https://esm.sh/preact/compat";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

function RenderGeometry({ geometry, active, onToggleActive }) {
  const onEnter = useCallback(async () => {
    const geometryData = await generateGeometry(geometry.geometryEntries[0]);

    if (geometryData) {
      await Forma.render.updateMesh({
        id: geometry.id,
        geometryData,
      });
    }
  });

  useEffect(async () => {
    if (active[geometry.id]) {
      const geometryData = await generateGeometry(geometry.geometryEntries[0]);
      if (geometryData) {
        await Forma.render.updateMesh({
          id: geometry.id,
          geometryData,
        });
      }
    }
  }, [active]);

  const onExit = useCallback(async () => {
    const geometryData = await generateGeometry(geometry.geometryEntries[0]);
    if (!active[geometry.id] && geometryData)
      await Forma.render.remove({
        id: geometry.id,
      });
  });

  return html`
    <button
      class=${active[geometry.id] ? "selected" : ""}
      onmouseenter=${onEnter}
      onmouseleave=${onExit}
      onclick=${() => onToggleActive(geometry.id)}
    >
      ${geometry.id.substring(0, 10)}
    </button>
  `;
}

function RenderGeometries({ geometry, active, onToggleActive }) {
  return (geometry || []).map(
    (geometry) =>
      html` <${RenderGeometry}
        geometry=${geometry}
        active=${active}
        onToggleActive=${onToggleActive}
      />`
  );
}

let initialActive = {};
try {
  initialActive = JSON.parse(
    localStorage.getItem(`dynamo-active-${Forma.getProjectId()}}`) || {}
  );
} catch (e) {
  console.warn("Errornous cache value for dynamo-active ignored");
}

function DynamoRunner({ url }) {
  const [active, setActive] = useState(initialActive);
  const [geometry, setGeometry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(async () => {
    let rootUrn = await Forma.proposal.getRootUrn();
    const id = setInterval(async () => {
      const urn = await Forma.proposal.getRootUrn();
      if (urn !== rootUrn) {
        setIsLoading(true);
        setGeometry(null);
        setGeometry(await callDynamo(url));
        setIsLoading(false);
        rootUrn = urn;
      }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const onToggleActive = useCallback(
    (id) => {
      const updated = { ...active, [id]: !active[id] };
      setActive(updated);
      localStorage.setItem(
        `dynamo-active-${Forma.getProjectId()}}`,
        JSON.stringify(updated)
      );
    },
    [active]
  );

  useEffect(async () => {
    setIsLoading(true);
    setGeometry(await callDynamo(url));
    setIsLoading(false);
  }, []);
  return html`
    <div>${isLoading && "loading"}</div>

    <${RenderGeometries}
      geometry=${geometry}
      active=${active}
      onToggleActive=${onToggleActive}
    />
  `;
}
