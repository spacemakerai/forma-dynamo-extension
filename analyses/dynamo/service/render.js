import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

export async function generateGeometry(entry) {
  const geometry = await new Promise((resolve) => {
    loader.load(
      "data:application/octet-stream;base64," + entry,
      async (gltf) => {
        resolve(gltf.scenes[0].children[0].geometry);
      }
    );
  });

  if (!geometry.getIndex()) {
    return null;
  }

  const positions = geometry.attributes.position.array;
  const index = [...geometry.getIndex().array];
  const position = filterPositions(positions);

  const nonIndexPositions = toNonIndexed(position, index);
  const color = Array(nonIndexPositions.length / 3)
    .fill([255, 0, 0, 255])
    .flat();

  return {
    position: nonIndexPositions,
    color: new Uint8Array(color),
  };
}

function filterPositions(array) {
  const res = new Float32Array(array.length / 2);
  let idx = 0;

  for (let i = 0; i < array.length; i += 6) {
    res[idx + 0] = array[i + 0];
    res[idx + 1] = -array[i + 2];
    res[idx + 2] = array[i + 1];
    idx += 3;
  }
  return res;
}

function toNonIndexed(positions, index) {
  const res = new Float32Array(index.length * 3);

  for (let i = 0; i < index.length; i++) {
    const idx = index[i] * 3;
    res[i * 3 + 0] = positions[idx + 0];
    res[i * 3 + 1] = positions[idx + 1];
    res[i * 3 + 2] = positions[idx + 2];
  }

  return res;
}
