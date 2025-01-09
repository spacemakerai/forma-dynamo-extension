import { useCallback, useEffect, useState } from "preact/hooks";
import { Forma } from "forma-embedded-view-sdk/auto";
import { v4 } from "uuid";
import { filterForSize } from "../../utils/filterGraph";
import { captureException } from "../../util/sentry";
import styles from "./PublishGraph.module.pcss";
import { DropZone } from "../DropZone";
import GraphItem from "../GraphItem/GraphItem";
import { AppPageState, ShareDestination } from "../../pages/DaasApp";

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

function toUpperCaseFirstLetter(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

type PageState =
  | { type: "default" }
  | { type: "invalid"; message: string }
  | { type: "publishing" }
  | { type: "published" }
  | { type: "failed" };

export function PublishGraph({
  initialValue,
  initialShareDestination,
  allowedDestinations,
  setPage,
  env,
}: {
  initialValue?: any;
  initialShareDestination: ShareDestination;
  allowedDestinations: ShareDestination[];
  setPage: (page: AppPageState) => void;
  env: "daas" | "local";
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState<User | undefined>(undefined);
  const [shareDestination, setShareDestination] =
    useState<ShareDestination>(initialShareDestination);
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
        authcontext: shareDestination === "project" ? Forma.getProjectId() : project.hubId,
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
  }, [name, description, author, publisher, shareDestination, uploadedGraph, setPage]);

  useEffect(() => {
    if (uploadedGraph?.Name?.length) setName(uploadedGraph.Name);
    if (uploadedGraph?.Description?.length) setDescription(uploadedGraph.Description);
    if (uploadedGraph?.Author?.length) setAuthor(uploadedGraph.Author);
  }, [uploadedGraph]);

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

      {uploadedGraph && <GraphItem env={env} graph={uploadedGraph} name={uploadedGraph.Name} />}

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

        <div className={styles.InputContainer}>
          <div>Choose where to share your graph:</div>
          <weave-radio-button-group
            onChange={(e) => {
              setShareDestination((e.target as HTMLInputElement).value as ShareDestination);
              e.stopPropagation();
            }}
          >
            <>
              {allowedDestinations.map((d) => (
                <weave-radio-button
                  key={d}
                  style={{ margin: "2px 0", cursor: "pointer" }}
                  name="environment"
                  value={d}
                  label={toUpperCaseFirstLetter(d)}
                  checked={shareDestination === d}
                />
              ))}
            </>
          </weave-radio-button-group>
        </div>

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
