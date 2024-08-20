export class FetchError extends Error {
  status: number;
  constructor(m: string, status: number) {
    super(m);

    this.status = status;
  }
}

export type DaasState =
  | {
      status: "online";
      serverInfo: ServerInfo;
    }
  | {
      status: "error";
      error: string;
    }
  | {
      status: "offline";
    };

export interface DynamoService {
  run: (target: GraphTarget, inputs: RunInputs) => Promise<Run>;
  folder: (path: string) => Promise<FolderGraphInfo[]>;
  info: (target: GraphTarget) => Promise<GraphInfo>;
  trust: (path: string) => Promise<boolean>;
  serverInfo: () => Promise<ServerInfo>;
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
      graph?: unknown;
      contents?: string;
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

export type Issue = {
  message: string;
  nodeId: string;
  nodeName: string;
  type: string;
};

export type Run = {
  info: {
    id: string;
    issues: Issue[];
    name: string;
    outputs: Output[];
    status: string;
  };
};

export type FolderGraphInfo = {
  type: "FolderGraph";
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

export type ServerInfo = {
  apiVersion: string;
  dynamoVersion: string;
  playerVersion: string;
};

const runSync = new URLSearchParams(window.location.search).get("ext:daas") === "sync";

class Dynamo implements DynamoService {
  private url: string;
  private authProvider?: () => Promise<string>;

  constructor(url: string, authProvider?: () => Promise<string>) {
    this.url = url;
    this.authProvider = authProvider;
  }

  async _fetch(input: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
    if (this.authProvider && init) {
      const headers = new Headers(init.headers);
      if (!headers.has("Authorization")) {
        const authzString = await this.authProvider();
        headers.set("Authorization", authzString);
        init.headers = headers;
      }
    }

    return fetch(input, init);
  }

  async runAsync(target: GraphTarget, inputs: RunInputs): Promise<Run> {
    const createJob = await this._fetch(`${this.url}/v1/graph/job/create`, { method: "GET" });

    if (createJob.status !== 200) {
      throw new FetchError(createJob.statusText, createJob.status);
    }

    const { jobId, uploadUrl } = await createJob.json();

    await fetch(uploadUrl, {
      method: "PUT",
      body: JSON.stringify({
        target,
        ignoreInputs: false,
        getImage: false,
        getGeometry: false,
        getContents: false,
        inputs,
      }),
    });

    const response = await this._fetch(`${this.url}/v1/graph/job/${jobId}/run`, {
      method: "POST",
    });

    if (response.status !== 200) {
      throw new FetchError(response.statusText, response.status);
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const jobResponse = await this._fetch(`${this.url}/v1/graph/results/${jobId}`, {
        method: "GET",
      });
      const job = await jobResponse.json();

      if (job.status === "SUCCESS" || job.status === "COMPLETE") {
        return job.result;
      } else if (job.status === "FAILED") {
        throw new FetchError("Job failed", 500);
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  async run(target: GraphTarget, inputs: RunInputs): Promise<Run> {
    if (!runSync && !this.url.startsWith("http://localhost")) {
      return this.runAsync(target, inputs);
    }

    const response = await this._fetch(`${this.url}/v1/graph/run`, {
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
    return this._fetch(`${this.url}/v1/graph-folder/info`, {
      method: "POST",
      body: JSON.stringify({
        path: path.replaceAll(/\\/g, "\\\\"),
      }),
    }).then((res) => res.json());
  }

  async info(target: GraphTarget): Promise<GraphInfo> {
    const response = await this._fetch(`${this.url}/v1/graph/info`, {
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
    const response = await this._fetch(`${this.url}/v1/settings/trusted-folder`, {
      method: "POST",
      body: JSON.stringify({
        path,
      }),
    });
    return await response.json();
  }

  async serverInfo(): Promise<ServerInfo> {
    const response = await this._fetch(`${this.url}/v1/server-info`);
    return await response.json();
  }

  static async health(port: number): Promise<Health> {
    const response = await fetch(`http://localhost:${port}/v1/health`);
    if (response.status === 200) {
      return { status: 200, port };
    }

    throw new FetchError(response.statusText, response.status);
  }
}

export default Dynamo;
