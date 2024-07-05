import { useCallback, useMemo, useState } from "preact/hooks";
import Dynamo from "../service/dynamo";
import { LocalScript } from "./LocalScript";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Health } from "../components/Health/Health";
import { useDynamoConnector } from "../DynamoConnector";
import { Import } from "../assets/icons/Import";
import Logo from "../assets/Logo.png";
import { PublicGraphs } from "../components/PublicGraphs/PublicGraphs";
import { JSONGraph } from "../types/types";

const env = new URLSearchParams(window.location.search).get("ext:daas") || "dev";

const urls: Record<string, string> = {
  DEV: "https://dev.service.dynamo.autodesk.com",
  STG: "https://stg.service.dynamo.autodesk.com",
  PROD: "https://service.dynamo.autodesk.com",
};

export function DaasApp() {
  const [graph, setGraph] = useState<JSONGraph | undefined>(undefined);

  const [dropped, setDropped] = useState<any | undefined>(undefined);

  const daas = useMemo(() => {
    return new Dynamo(urls[String(env).toUpperCase()] || urls["DEV"], async () => {
      const { accessToken } = await Forma.auth.acquireTokenOverlay();
      return `Bearer ${accessToken}`;
    });
  }, []);

  // TODO: we don't need to handle multiple files
  const onDrop = useCallback<JSX.DragEventHandler<HTMLDivElement>>(
    (event) => {
      console.log(123);
      event.preventDefault();
      if (event.dataTransfer?.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...(event.dataTransfer?.items || [])].forEach((item) => {
          // If dropped items aren't files, reject them
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              file.text().then((text) => {
                const graph = JSON.parse(text);
                setDropped(graph);
              });
            }
          }
        });
      } else {
        // Use DataTransfer interface to access the file(s)
        [...(event.dataTransfer?.files || [])].forEach((file) => {
          file.text().then((text) => {
            const graph = JSON.parse(text);
            setDropped(graph);
          });
        });
      }
    },
    [setDropped],
  );

  const openDroppedGraph = useCallback(() => {
    setGraph({
      id: "2",
      type: "JSON",
      name: dropped.Name,
      graph: dropped,
    });
  }, [setGraph, dropped]);

  const dynamoLocal = useDynamoConnector();

  return (
    <div>
      <Health daas={daas} local={dynamoLocal.state} />
      {!graph && (
        <>
          <h4>My own graph</h4>
          <div id="dropzone">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "60px",
                border: "1px dashed var(--border-base)",
                borderRadius: "4px",
              }}
              onDragOver={(e) => {
                console.log("dragover");
                e.preventDefault();
              }}
              onDrop={onDrop}
            >
              <Import />
              <b>Drag & Drop</b>
              Files to import (.dyn)
            </div>
          </div>
          {dropped && (
            <div
              style={{
                margin: "16px 8px 16px 8px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "colum" }}>
                <img style={{ marginRight: "4px" }} src={Logo} />
                <div style={{ height: "24px", alignContent: "center" }}>{dropped.Name}.dyn</div>
              </div>
              <weave-button variant="solid" onClick={openDroppedGraph}>
                Open
              </weave-button>
            </div>
          )}
          <div
            style={{ borderBottom: "1px solid var(--divider-lightweight)", paddingBottom: "8px" }}
          >
            <h4>Organization Graph</h4>
            <div>
              No graphs are shared within your organization.{" "}
              <weave-button variant="flat">Learn more</weave-button>
            </div>

            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
              <div style={{ height: "24px", alignContent: "center" }}>
                Share graph within my organisation
              </div>
              <weave-button onClick={() => alert("share")}>Publish graph</weave-button>
            </div>
          </div>
          <PublicGraphs setGraph={setGraph} />
        </>
      )}
      {graph && <LocalScript script={graph} setScript={setGraph} dynamo={daas} />}
    </div>
  );
}
