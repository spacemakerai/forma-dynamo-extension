import dynamoIconUrn from "../icons/dynamo.png";

export function BlockedPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={dynamoIconUrn} />
        <h1
          style={{
            fontFamily: "Artifact Element",
            marginLeft: "5px",
            fontSize: "12px",
          }}
        >
          Dynamo Player
        </h1>
      </div>
      <div>Dynamo seems to be blocked</div>

      <div>Please open Dynamo and follow instructions.</div>
    </div>
  );
}
