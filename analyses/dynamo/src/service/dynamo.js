import {
  getConstraints,
  getProposal,
  getSurroundings,
} from "../util/geometry.js";
import { Forma } from "https://esm.sh/forma-embedded-view-sdk/auto";

async function evaluate(name, value) {
  if (name === "Constraints") {
    return await getConstraints();
  } else if (name === "Proposal") {
    return await getProposal();
  } else if (name === "Surroundings") {
    return await getSurroundings();
  } else {
    return eval(value, { Forma });
  }
}

export async function run(url, code) {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        target: {
          type: "JsonGraphTarget",
          contents: JSON.stringify(code),
        },
        ignoreInputs: false,
        getImage: false,
        getGeometry: true,
        getContents: false,
        inputs: code.Inputs.map(({ Name, Id, Value }) => ({
          nodeId: Id,
          value: eval(Name, Value),
        })),
      }),
    });

    return await response.json();
  } catch (e) {
    console.error(e);
  }
}
