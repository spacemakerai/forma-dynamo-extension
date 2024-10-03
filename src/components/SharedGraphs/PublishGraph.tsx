import { useCallback, useEffect, useState } from "preact/hooks";
import { Forma } from "forma-embedded-view-sdk/auto";
import { v4 } from "uuid";
import { filterForSize } from "../../utils/filterGraph";
import { captureException } from "../../util/sentry";
import styles from "./PublishGraph.module.pcss";
import Logo from "../../assets/Logo.png";
import { DropZone } from "../DropZone";

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

function Item({ graph }: { graph: DynamoGraph; onClear: () => void }) {
  return (
    <div key={graph.id} className={styles.GraphContainer}>
      <div className={styles.GraphInfo}>
        <img className={styles.GraphIcon} src={Logo} />
        <div className={styles.GraphName}>{graph.Name}.dyn</div>
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
      <div className={styles.ShareGraphTitle}>Share Graph</div>
      {!uploadedGraph && (
        <>
          <div style={{ margin: "8px 0" }}>
            Upload graph {!uploadedGraph && <span style={{ color: "red" }}> *</span>}
          </div>
          <DropZone
            parse={async (file: File) => JSON.parse(await file.text())}
            filetypes={[".dyn"]}
            onFileDropped={setUploadedGraph}
          />
        </>
      )}

      {uploadedGraph && <Item graph={uploadedGraph} onClear={onClear} />}

      <div className={styles.PublishGraphForm}>
        <div className={styles.InputContainer}>
          <div>
            Name
            {name === "" && <span className={styles.Required}> *</span>}
          </div>
          <weave-input
            value={name}
            className={styles.Input}
            // @ts-ignore
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.InputContainer}>
          <div>
            Description
            {description === "" && <span className={styles.Required}> *</span>}
          </div>
          <textarea
            value={description}
            className={styles.TextArea}
            // @ts-ignore
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.InputContainer}>
          <div>
            Author
            {author === "" && <span className={styles.Required}> *</span>}
          </div>
          <weave-input
            value={author}
            className={styles.Input}
            // @ts-ignore
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>

        <div className={styles.InputContainer}>
          <div>
            Publisher
            {publisher?.name === "" && <span className={styles.Required}> *</span>}
          </div>
          <weave-input value={publisher?.name} disabled={true} className={styles.Input} />
        </div>

        {state.type === "invalid" && <div className={styles.ErrorMessage}>{state.message}</div>}

        {state.type === "failed" && (
          <div className={styles.ErrorMessage}>Sharing failed. Try again.</div>
        )}

        <div className={styles.ButtonContainer}>
          <weave-button className={styles.Button} onClick={() => setPage({ name: "default" })}>
            Cancel
          </weave-button>
          <weave-button
            className={styles.Button}
            variant="solid"
            disabled={state.type === "publishing"}
            onClick={publishGraph}
          >
            {state.type === "publishing" ? "Sharing" : "Share"}
          </weave-button>
        </div>
      </div>
    </>
  );
}
