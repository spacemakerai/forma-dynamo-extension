import { useCallback, useEffect, useState } from "preact/hooks";
import { DropZone } from "../DropZone";
import { Forma } from "forma-embedded-view-sdk/auto";
import { v4 } from "uuid";
import { Image } from "../../icons/Image";

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

export function PublishGraph({
  setPage,
}: {
  setPage: (page: "default" | "setup" | "publish") => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState<User | undefined>(undefined);
  const [thumbnail, setThumbnail] = useState("");

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

  const [uploadedGraph, setUploadedGraph] = useState<DynamoGraph | undefined>(undefined);

  const publishGraph = useCallback(async () => {
    try {
      await Forma.extensions.storage.setObject({
        key: v4(),
        data: JSON.stringify({
          ...uploadedGraph,
          Name: name,
          Description: description,
          Author: author,
          Thumbnail: thumbnail,
        }),
        metadata: encodeURIComponent(
          JSON.stringify({
            publisher: {
              sub: publisher?.sub,
              name: publisher?.name,
            },
          }),
        ),
      });

      setPage("default");
    } catch (e) {
      console.error(e);
    }
  }, [name, description, author, publisher, thumbnail, uploadedGraph, setPage]);

  useEffect(() => {
    if (uploadedGraph?.Name?.length) setName(uploadedGraph.Name);
    if (uploadedGraph?.Description?.length) setDescription(uploadedGraph.Description);
    if (uploadedGraph?.Author?.length) setAuthor(uploadedGraph.Author);
    if (uploadedGraph?.Thumbnail?.length) setThumbnail(uploadedGraph.Thumbnail);
  }, [uploadedGraph]);

  return (
    <>
      <weave-button onClick={() => setPage("default")}>{"<"} Cancel</weave-button>

      <div style={{ marginTop: "16px" }}>
        Graph
        <div style={{ marginTop: "8px" }}>
          <DropZone
            filetypes={[".dyn"]}
            onFileDropped={async (file) => {
              try {
                setUploadedGraph(JSON.parse(await file.text()));
              } catch (e) {
                console.error(e);
              }
            }}
          />
        </div>
      </div>

      <div style={{ margin: "16px 0" }}>
        Name
        <weave-input
          value={name}
          style={{ width: "100%" }}
          // @ts-ignore
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        Description
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
        <weave-input
          value={author}
          style={{ width: "100%" }}
          // @ts-ignore
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        Publisher
        <weave-input value={publisher?.name} disabled={true} style={{ width: "100%" }} />
      </div>

      <div>
        Thumbnail
        <div style={{ display: "flex", flexDirection: "row", marginTop: "8px" }}>
          <div>
            {!thumbnail && (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  backgroundColor: "#EEE",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "4px",
                }}
              >
                <Image />
              </div>
            )}
            {thumbnail && (
              <img
                width="100px"
                height="100px"
                style={{ objectFit: "cover", borderRadius: "4px" }}
                src={`data:image/png;base64,${thumbnail}`}
                alt="thumbnail"
              />
            )}
          </div>
          <div style={{ width: "100%", height: "100px", display: "flex", marginLeft: "16px" }}>
            <DropZone
              filetypes={[".png"]}
              onFileDropped={async (file) => {
                try {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  const result: string = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = reject;
                  });

                  setThumbnail(result.replace("data:image/png;base64,", ""));
                } catch (e) {
                  console.error(e);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <weave-button style={{ width: "120px" }} variant="solid" onClick={publishGraph}>
          Publish
        </weave-button>
      </div>
    </>
  );
}
