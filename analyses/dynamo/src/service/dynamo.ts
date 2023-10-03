let dynamoUrl = "http://localhost:55000";

try {
  const url = sessionStorage.getItem("dynamo-url");
  if (url && url.startsWith("http")) {
    dynamoUrl = url;
    console.log("Overriding dynamo url: " + dynamoUrl);
  }
} catch (e) {
  console.error(e);
}

function createTarget(code: any) {
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

export async function health() {
  try {
    const response = await fetch(dynamoUrl + "/v1/health");
    await response.json();
    return true;
  } catch (e) {
    return false;
  }
}

export async function run(code: any, inputs: any) {
  const target = createTarget(code);

  try {
    const response = await fetch(dynamoUrl + "/v1/graph/run", {
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

export async function graphFolderInfo(path: string) {
  return fetch(dynamoUrl + "/v1/graph-folder/info", {
    method: "POST",
    body: JSON.stringify({
      path: path.replaceAll(/\\/g, "\\\\"),
    }),
  }).then((res) => res.json());
}

export async function info(code: any) {
  const target = createTarget(code);

  try {
    const response = await fetch(dynamoUrl + "/v1/graph/info", {
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
