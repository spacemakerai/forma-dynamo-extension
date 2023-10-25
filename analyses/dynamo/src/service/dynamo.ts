class FetchError extends Error {
  status: number;
  constructor(m: string, status: number) {
    super(m);

    this.status = status;
  }
}

function getDynamoUrl() {
  let dynamoUrl = "http://localhost:55100";

  try {
    const url = localStorage.getItem("dynamo-url");
    if (url && url.startsWith("http")) {
      dynamoUrl = url;
    }
  } catch (e) {
    console.error(e);
  }
  return dynamoUrl;
}

export function createTarget(code: any) {
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

type Health = "READY" | "BLOCKED" | "UNAVAILABLE";

export async function health(): Promise<Health> {
  try {
    const response = await fetch(getDynamoUrl() + "/v1/health");
    if (response.status === 200) {
      return "READY";
    } else if (response.status === 503) {
      return "BLOCKED";
    } else {
      return "UNAVAILABLE";
    }
  } catch (e) {
    return "UNAVAILABLE";
  }
}

export async function run(url: string, code: any, inputs: any) {
  const target = createTarget(code);
  const response = await fetch(url + "/v1/graph/run", {
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
}

export async function graphFolderInfo(url: string, path: string) {
  return fetch(url + "/v1/graph-folder/info", {
    method: "POST",
    body: JSON.stringify({
      path: path.replaceAll(/\\/g, "\\\\"),
    }),
  }).then((res) => res.json());
}

export async function info(url: string, code: any) {
  const target = createTarget(code);

  const response = await fetch(url + "/v1/graph/info", {
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

  if (response.status === 200) {
    return await response.json();
  } else {
    const body = await response.json();
    throw new FetchError(body?.title || response.statusText, response.status);
  }
}

export async function trust(url: string, path: string) {
  await fetch(url + "/v1/settings/trusted-folder", {
    method: "POST",
    body: JSON.stringify({
      path,
    }),
  });
}
