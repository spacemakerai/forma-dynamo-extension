export async function getGraphBuildingForSubTree(path: string) {
  const { element, elements } = await Forma.elements.getByPath({ path, recursive: true });

  const graphs = [];
  const stack = [{ path, element }];
  while (stack.length) {
    const { path, element } = stack.pop()!;

    for (const child of element?.children ?? []) {
      stack.push({ path: `${path}/${child.key}`, element: elements[child.urn] });
    }
    try {
      const graph = await Forma.experimental.representations.graphBuilding({ urn: element.urn });

      const { transform } = await Forma.elements.getWorldTransform({ path });

      const transformed = applyTransform(graph, transform);
      graphs.push(transformed);
    } catch (e) {
      console.warn(e);
      // Ignore not found graph building
    }
  }

  return graphs;
}

type Transform = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export function transformCoordinates(v: [number, number], t: Transform) {
  return [v[0] * t[0] + v[1] * t[4] + 1 * t[12], v[0] * t[1] + v[1] * t[5] + 1 * t[13]];
}

function transformLevel(level, transform: Transform) {
  const xyPoints = {};

  for (const key of Object.keys(level.xyPoints)) {
    xyPoints[key] = transformCoordinates(level.xyPoints[key], transform);
  }

  return { ...level, xyPoints };
}

function applyTransform(graph, transform: Transform) {
  return {
    ...graph,
    buildingLevels: graph.buildingLevels.map((level) => transformLevel(level, transform)),
  };
}
