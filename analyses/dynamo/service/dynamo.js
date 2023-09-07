import {
  getConstraints,
  getProposal,
  getSurroundings,
} from "../util/geometry.js";

// random 32 character string
const string = () => Math.random().toString(36).substring(2, 15);

export async function callDynamo(url, code) {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        target: {
          type: "JsonGraphTarget",
          contents: code,
        },
        ignoreInputs: false,
        getImage: false,
        getGeometry: true,
        getContents: false,
        inputs: [
          {
            nodeId: "61ac694796d9473d8c24b94c24df829f",
            value: JSON.stringify(await getProposal()),
          },
          {
            nodeId: "ed33cc713fd944319fe1d0516b764c4b",
            value: JSON.stringify(await getSurroundings()),
          },
          {
            nodeId: "57d3a29891014ef89bac997b62da466c",
            value: JSON.stringify(await getConstraints()),
          },
        ],
      }),
    });

    return await response.json();
  } catch (e) {
    console.error(e);
  }
}
