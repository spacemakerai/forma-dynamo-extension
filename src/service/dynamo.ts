class FetchError extends Error {
  status: number;
  constructor(m: string, status: number) {
    super(m);

    this.status = status;
  }
}

export function createTarget(code: any) {
  if (code.id) {
    return {
      type: "PathGraphTarget",
      path: code.id,
      forceReopen: false,
    };
  }
  return {
    type: "JsonGraphTarget",
    contents: JSON.stringify(code),
  };
}

export async function run(url: string, code: any, inputs: any) {
  const target = createTarget(code);
  const response = await fetch(`${url}/v1/graph/run`, {
    method: "POST",
    body: JSON.stringify({
      target,
      ignoreInputs: false,
      getImage: false,
      getGeometry: false,
      getContents: false,
      inputs,
    }),
  });
  return await response.json();
}

export async function graphFolderInfo(url: string, path: string) {
  return fetch(`${url}/v1/graph-folder/info`, {
    method: "POST",
    body: JSON.stringify({
      path: path.replaceAll(/\\/g, "\\\\"),
    }),
  }).then((res) => res.json());
}

export async function info(url: string, code: any) {
  const target = createTarget(code);

  const response = await fetch(`${url}/v1/graph/info`, {
    method: "POST",
    body: JSON.stringify({
      target,
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
  }
  const body = await response.json();
  throw new FetchError(body?.title || response.statusText, response.status);
}

export async function trust(url: string, path: string) {
  await fetch(`${url}/v1/settings/trusted-folder`, {
    method: "POST",
    body: JSON.stringify({
      path,
    }),
  });
}

export async function health(port: number) {
  try {
    const response = await fetch(`http://localhost:${port}/v1/health`);
    if (response.status === 200) {
      return { status: 200, port };
    }
    // TODO: make sure 503 errors end up here
    else if (response.status === 503) {
      return { status: 503, port };
    }
    return { status: 500, port };
  } catch (e) {
    return { status: 500, port };
  }
}
