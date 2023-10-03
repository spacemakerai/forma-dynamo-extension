//const dynamoUrl = "https://app.dynaas-c-uw2.cloudos.autodesk.com/v1/graph";
const dynamoUrl = "http://localhost:55000/v1";
// const dynamoUrl = "https://cb5e-20-126-50-171.ngrok.io/v1";

function createTarget(code) {
  if (code.id) {
    return {
      type: "PathGraphTarget",
      path: code.id,
      forceReopen: false,
    };
  } else {
    return {
      type: "JsonGraphTarget",
      contents: JSON.stringify(code),
    };
  }
}

export async function run(code, inputs) {
  const target = createTarget(code);

  try {
    const response = await fetch(dynamoUrl + "/graph/run", {
      method: "POST",
      body: JSON.stringify({
        target: target,
        ignoreInputs: false,
        getImage: false,
        getGeometry: false,
        getContents: false,
        inputs: inputs,
      }),
    });

    return await response.json();
  } catch (e) {
    console.error(e);
  }
}

export async function graphFolderInfo(path) {
  return fetch(dynamoUrl + "/graph-folder/info", {
    method: "POST",
    body: JSON.stringify({
      path: path.replaceAll(/\\/g, "\\\\"),
    }),
  }).then((res) => res.json());
}

export async function info(code) {
  const target = createTarget(code);

  try {
    const response = await fetch(dynamoUrl + "/graph/info", {
      method: "POST",
      body: JSON.stringify({
        target: target,
        options: {
          metadata: true,
          issues: true,
          status: true,
          inputs: true,
          outputs: true,
          dependencies: true,
        },
      }),
    });

    return await response.json();
  } catch (e) {
    console.error(e);
  }
}
