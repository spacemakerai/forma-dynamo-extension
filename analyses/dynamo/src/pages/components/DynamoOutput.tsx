type Output = {
  type: "Watch3D" | string;
  name: string;
  value: string;
};

export function DynamoOutput({ output }: any) {
  if (output.type === "init") return null;
  if (output.type === "error") return <div>Failed</div>;
  if (output.type === "running") return <div>Loading...</div>;

  const outputs = (output.data?.info?.outputs || []) as Output[];

  return (
    <div>
      {outputs
        .filter(({ type }) => type !== "Watch3D")
        .map((output) => (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "5px",
              paddingBottom: "5px",
            }}
          >
            <span>{output.name}</span>
            <span> {output.value}</span>
          </div>
        ))}
    </div>
  );
}
