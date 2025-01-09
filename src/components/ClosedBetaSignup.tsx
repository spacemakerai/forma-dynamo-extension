export function ClosedBetaSignup() {
  return (
    <div
      style={{
        border: "1px solid var(--divider-lightweight)",
        borderRadius: "5px",
        padding: "0 16px 16px 16px",
      }}
    >
      <h3>Dynamo as a Service for Forma - Early Access</h3>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div>
          For now this is released under a closed beta.{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://dynamobim.org/dynamo-as-a-service-powers-up-dynamo-player-in-forma"
          >
            Read more this on our blog
          </a>{" "}
          and sign up now to get early access!
        </div>
        <div style={{ marginLeft: "32px" }}>
          <weave-button
            variant="solid"
            onClick={() =>
              window.open("https://feedback.autodesk.com/key/DynamoForma", "_blank", "noreferrer")
            }
          >
            Sign up
          </weave-button>
        </div>
      </div>
    </div>
  );
}
