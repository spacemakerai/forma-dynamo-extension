import { useCallback, useEffect, useState } from "preact/hooks";
import { DropZone } from "../DropZone";
import { Forma } from "forma-embedded-view-sdk/auto";
import { v4 } from "uuid";
import { filterForSize } from "../../utils/filterGraph";
import { captureException } from "../../util/sentry";
import { Delete } from "../../icons/Delete";
import { File } from "../../icons/File";

type DynamoGraph = {
  Name: string;
  Description: string;
  Author: string;
  Thumbnail: string;
  [key: string]: any;
};

type User = {
  sub: string;
  name: string;
};

type PageState =
  | { type: "default" }
  | { type: "invalid"; message: string }
  | { type: "publishing" }
  | { type: "published" }
  | { type: "failed" };

function Item({ graph, onClear }: { graph: DynamoGraph; onClear: () => void }) {
  return (
    <div
      key={graph.Id}
      style={{
        padding: "8px 8px 8px 0px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "colum", overflow: "hidden" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              minWidth: "18px",
              backgroundColor: "#3C3C3C",
              borderRadius: "4px",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
            }}
          >
            <File />
          </div>
        </div>
        <div style={{ height: "24px", alignContent: "center" }}>{graph.Name}.dyn</div>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            display: "flex",
            cursor: "pointer",
            height: "24px",
            width: "24px",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={onClear}
        >
          <Delete />
        </div>
      </div>
    </div>
  );
}

export function PublishGraph({
  initialValue,
  setPage,
}: {
  initialValue?: any;
  setPage: (
    page: { name: "default" } | { name: "setup" } | { name: "publish"; default?: any },
  ) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState<User | undefined>(undefined);
  const [state, setState] = useState<PageState>({ type: "default" });

  useEffect(() => {
    Forma.auth.acquireTokenOverlay().then(({ accessToken }) => {
      fetch("https://api.userprofile.autodesk.com/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setPublisher(data);
        });
    });
  }, []);

  const [uploadedGraph, setUploadedGraph] = useState<DynamoGraph | undefined>(initialValue);

  const publishGraph = useCallback(async () => {
    try {
      setState({ type: "publishing" });
      if (!name || !description || !author || !uploadedGraph) {
        setState({
          type: "invalid",
          message: `Please fill out ${
            !name ? "Name" : !description ? "Description" : !author ? "Author" : "Graph"
          }`,
        });
        return;
      }
      const project = await Forma.project.get();
      await Forma.extensions.storage.setObject({
        key: v4(),
        authcontext: project.hubId,
        data: JSON.stringify(
          filterForSize({
            ...uploadedGraph,
            Name: name,
            Description: description,
            Author: author,
          }),
        ),
        metadata: encodeURIComponent(
          JSON.stringify({
            publisher: {
              sub: publisher?.sub,
              name: publisher?.name,
            },
          }),
        ),
      });

      setState({ type: "published" });
      setPage({ name: "default" });
    } catch (e) {
      captureException(e, "Error sharing graph");
      setState({ type: "failed" });
    }
  }, [name, description, author, publisher, uploadedGraph, setPage]);

  useEffect(() => {
    if (uploadedGraph?.Name?.length) setName(uploadedGraph.Name);
    if (uploadedGraph?.Description?.length) setDescription(uploadedGraph.Description);
    if (uploadedGraph?.Author?.length) setAuthor(uploadedGraph.Author);
  }, [uploadedGraph]);

  const onClear = useCallback(() => {
    setName("");
    setDescription("");
    setAuthor("");
    setUploadedGraph(undefined);
  }, []);

  return (
    <>
      <weave-button onClick={() => setPage({ name: "default" })}>{"<"} Cancel</weave-button>

      <div style={{ marginTop: "16px" }}>
        Graph
        {!uploadedGraph && <span style={{ color: "red" }}> *</span>}
        <div style={{ marginTop: "8px" }}>
          <DropZone
            parse={async (file: File) => JSON.parse(await file.text())}
            filetypes={[".dyn"]}
            onFileDropped={setUploadedGraph}
          />
        </div>
        {uploadedGraph && <Item graph={uploadedGraph} onClear={onClear} />}
      </div>

      <div style={{ margin: "16px 0" }}>
        Name
        {name === "" && <span style={{ color: "red" }}> *</span>}
        <weave-input
          value={name}
          style={{ width: "100%" }}
          // @ts-ignore
          onChange={(e) => setName(e.target.value)}
          className={name === "" ? "required" : ""}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        Description
        {description === "" && <span style={{ color: "red" }}> *</span>}
        <textarea
          value={description}
          style={{
            width: "calc(100% - 14px)",
            height: "70px",
            font: "var(--medium-medium)",
            padding: "6px 6px",
            borderColor: "rgba(128, 128, 128, 0.2)",
            color: "var(--text-default)",
            outline: 0,
            resize: "none",
          }}
          // @ts-ignore
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        Author
        {author === "" && <span style={{ color: "red" }}> *</span>}
        <weave-input
          value={author}
          style={{ width: "100%" }}
          // @ts-ignore
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        Publisher
        {publisher?.name === "" && <span style={{ color: "red" }}> *</span>}
        <weave-input value={publisher?.name} disabled={true} style={{ width: "100%" }} />
      </div>

      {state.type === "invalid" && (
        <div style={{ color: "red", marginBottom: "16px" }}>{state.message}</div>
      )}

      {state.type === "failed" && (
        <div style={{ color: "red", marginBottom: "16px" }}>Sharing failed. Try again.</div>
      )}

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <weave-button
          style={{ width: "120px" }}
          variant="solid"
          disabled={state.type === "publishing"}
          onClick={publishGraph}
        >
          {state.type === "publishing" ? "Sharing" : "Share"}
        </weave-button>
      </div>
    </>
  );
}
