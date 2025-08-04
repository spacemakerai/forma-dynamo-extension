export class FetchError extends Error {
  status: number;
  constructor(m: string, status: number) {
    super(m);

    this.status = status;
  }
}

export class DaasError extends Error {
  jobId: string | null;
  constructor(jobId: string | null, originalErr: Error) {
    super();

    this.message = `Failed run ${jobId ?? "unknownJobId"} with error: ${originalErr.message}`;
    this.stack = originalErr.stack;
    this.jobId = jobId;
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
  //TODO fix for local.
  run: (
    target: GraphTarget,
    inputs: RunInputs,
    onUpdate: OnUpdateRunStatus,
  ) => Promise<DaasRunResult>;
  folder: (path: string) => Promise<FolderGraphInfo[]>;
  info: (target: GraphTarget) => Promise<GraphInfo>;
  trust: (path: string) => Promise<boolean>;
  serverInfo: () => Promise<ServerInfo>;
  log: (jobId: string) => Promise<string>;
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

export type OnUpdateRunStatus = {
  (status: string): void;
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

//we probably should just derive a new type from this type for daas runs...
//TODO
export type Run = {
  info: {
    id: string;
    issues: Issue[];
    name: string;
    outputs: Output[];
    status: string;
  };
  title?: string;
};

export enum DaaSJobStatus {
  // States that are set from the forma client side
  CLIENT_INITIALIZED = "CLIENT_INITIALIZED",
  CLIENT_PREPARING = "CLIENT_PREPARING",
  // States that are set by the Dynamo service
  CREATED = "CREATED",
  PENDING = "PENDING",
  EXECUTING = "EXECUTING",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
  TIMEOUT = "TIMEOUT",
}

export type DaasRunResult = {
  result?: Run;
  status?: DaaSJobStatus;
  jobId?: string;
  error?: string;
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

  async log(jobId: string): Promise<string> {
      const getLog = await this._fetch(`${this.url}/v1/graph/job/${jobId}/log`, { method: "GET" });

    if (getLog.status !== 200) {
      throw new FetchError(getLog.statusText, getLog.status);
    }

    return await getLog.text();
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

  async createJob() {
    const createJob = await this._fetch(`${this.url}/v1/graph/job/create`, { method: "GET" });

    if (createJob.status !== 200) {
      throw new FetchError(createJob.statusText, createJob.status);
    }

    return await createJob.json();
  }

  async runAsync(
    jobId: string,
    target: GraphTarget,
    uploadUrl: string,
    inputs: RunInputs,
    onUpdate: OnUpdateRunStatus,
    //TODO define type for the real return type from daas results.
    //TODO will have to see how to keep local desktop runs working since local does not return daas format.
  ): Promise<DaasRunResult> {
    await fetch(uploadUrl, {
      method: "PUT",
      body: JSON.stringify({
        target,
        ignoreInputs: false,
        getImage: false,
        getGeometry: false,
        getContents: false,
        inputs,
        collectLogs: true
      }),
    });

    const response = await this._fetch(`${this.url}/v1/graph/job/${jobId}/run?passtoken=1`, {
      method: "POST",
    });

    if (response.status !== 200) {
      throw new FetchError(response.statusText, response.status);
    }

    while (true) {
      const jobResponse = await this._fetch(`${this.url}/v1/graph/results/${jobId}`, {
        method: "GET",
      });
      const job = (await jobResponse.json()) as DaasRunResult;

      if (
        job.status === DaaSJobStatus.COMPLETE ||
        job.status === DaaSJobStatus.FAILED ||
        job.status === DaaSJobStatus.TIMEOUT
      ) {
        return job;
      }
      onUpdate(job.status!);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  async run(
    target: GraphTarget,
    inputs: RunInputs,
    onUpdate: OnUpdateRunStatus,
  ): Promise<DaasRunResult> {
    if (!runSync && !this.url.startsWith("http://localhost")) {
      const { jobId, uploadUrl } = await this.createJob();

      try {
        return this.runAsync(jobId, target, uploadUrl, inputs, onUpdate);
      } catch (err: any) {
        throw new DaasError(jobId, err);
      }
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
    const reqData = {
      method: "POST",
      body: JSON.stringify({
        target,
        data: {
          metadata: true,
          issues: true,
          status: true,
          inputs: true,
          outputs: true,
          dependencies: true,
        },
      }),
    };

    let response = await this._fetch(`${this.url}/v1/graph/info`, reqData);
    const maxRetries = 3;
    let ii = 0;
    while (response.status === 500 && ii <= maxRetries) {
      try {
        response = await this._fetch(`${this.url}/v1/graph/info`, reqData);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch {
        console.warn("Failed to fetch, retrying...");
      } finally {
        ii++;
      }
    }

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
