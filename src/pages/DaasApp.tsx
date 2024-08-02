import { useMemo, useState } from "preact/hooks";
import Dynamo from "../service/dynamo";
import { LocalScript } from "./LocalScript";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Health } from "../components/Health/Health";
import { useDynamoConnector } from "../DynamoConnector";
import { PublicGraphs } from "../components/PublicGraphs/PublicGraphs";
import { JSONGraph } from "../types/types";
import { createRef } from "preact";
import { MyGraphs } from "../components/Sections/MyGraphs";

const env = new URLSearchParams(window.location.search).get("ext:daas") || "dev";

const urls: Record<string, string> = {
  DEV: "https://dev.service.dynamo.autodesk.com",
  STG: "https://stg.service.dynamo.autodesk.com",
  PROD: "https://service.dynamo.autodesk.com",
};

export function DaasApp() {
  const [graph, setGraph] = useState<JSONGraph | undefined>(undefined);

  const daas = useMemo(() => {
    return new Dynamo(urls[String(env).toUpperCase()] || urls["DEV"], async () => {
      const { accessToken } = await Forma.auth.acquireTokenOverlay();
      return `Bearer ${accessToken}`;
    });
  }, []);

  const dynamoLocal = useDynamoConnector();

  const ref = createRef<HTMLDivElement>();
  const [dragging, setDragging] = useState(false);

  return (
    <div
      ref={ref}
      onDragEnterCapture={(e) => {
        e.stopPropagation();
        setDragging(true);
      }}
      onDragLeaveCapture={(e) => {
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        const rect = ref.current?.getBoundingClientRect();

        if (rect && (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)) {
          setDragging(false);
        }
      }}
    >
      <Health daas={daas} local={dynamoLocal.state} />
      {!graph && (
        <>
          <MyGraphs setGraph={setGraph} dragging={dragging} setDragging={setDragging} />
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
      {graph && (
        <LocalScript
          script={graph}
          setScript={setGraph}
          services={{
            daas,
            local: dynamoLocal.dynamo,
          }}
        />
      )}
    </div>
  );
}
