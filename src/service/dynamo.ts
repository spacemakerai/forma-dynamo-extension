class FetchError extends Error {
  status: number;
  constructor(m: string, status: number) {
    super(m);

    this.status = status;
  }
}

export interface DynamoService {
  run: (target: GraphTarget, inputs: RunInputs) => Promise<Run>;
  folder: (path: string) => Promise<FolderGraphInfo[]>;
  info: (target: GraphTarget) => Promise<GraphInfo>;
  trust: (path: string) => Promise<boolean>;
  //health: (port: number) => Promise<Health>;
}

export type GraphTarget =
  | {
      type: "PathGraphTarget";
      path: string;
      forceReopen?: boolean;
    }
  | {
      type: "CurrentGraphTarget";
    }
  | {
      type: "JsonGraphTarget";
      json?: unknown;
      code: string;
    };

export type Input = {
  id: string;
  name: string;
  type: string;
  value: string;
  nodeTypeProperties: {
    options: string[];
    minimumValue: number;
    maximumValue: number;
    stepValue: number;
  };
};

export type Output = {
  id: string;
  name: string;
  type: string;
  value: string | number;
  valueString?: {
    count: number;
    value: string | number;
  };
};

export type Metadata = {
  author: string;
  customProperties: unknown;
  description: string;
  dynamoVersion: string;
  thumbnail: string;
};

export type Run = {
  info: {
    id: string;
    issues: unknown[];
    name: string;
    outputs: Output[];
    status: string;
  };
};

export type FolderGraphInfo = {
  id: string;
  metadata: Metadata;
  name: string;
};

export type GraphInfo = {
  dependencies: Array<{ name: string; version: string; type: string; state: string }>;
  id: string;
  inputs: Array<Input>;
  issues: Array<unknown>;
  metadata: Metadata;
  name: string;
  outputs: Output[];
  status: string;
};

type Health = {
  status: number;
  port: number;
};

export type RunInputs = { nodeId: string; value: any }[];

class Dynamo implements DynamoService {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async run(target: GraphTarget, inputs: RunInputs): Promise<Run> {
    const response = await fetch(`${this.url}/v1/graph/run`, {
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

  async folder(path: string): Promise<FolderGraphInfo[]> {
    return fetch(`${this.url}/v1/graph-folder/info`, {
      method: "POST",
      body: JSON.stringify({
        path: path.replaceAll(/\\/g, "\\\\"),
      }),
    }).then((res) => res.json());
  }

  async info(target: GraphTarget): Promise<GraphInfo> {
    const response = await fetch(`${this.url}/v1/graph/info`, {
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

  async trust(path: string): Promise<boolean> {
    const response = await fetch(`${this.url}/v1/settings/trusted-folder`, {
      method: "POST",
      body: JSON.stringify({
        path,
      }),
    });
    return await response.json();
  }

  static async health(port: number): Promise<Health> {
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
}

export default Dynamo;
