const filtered = [
  "DynamoForma.NodeModels.GetTerrain, DynamoForma.NodeModels",
  "DynamoForma.NodeModels.GetProject, DynamoForma.NodeModels",
  "DynamoForma.NodeModels.SelectMetrics, DynamoForma.NodeModels",
  "DynamoForma.NodeModels.SelectElements, DynamoForma.NodeModels",
  "DynamoForma.NodeModels.GetAllElements, DynamoForma.NodeModels",
];

export function filterForSize(graph: any) {
  const inputs = graph.Inputs;
  const nodes = graph.Nodes;

  const formaNodes = nodes.filter(({ ConcreteType }: any) => filtered.includes(ConcreteType));

  const nodeIds = formaNodes.map(({ Id }: any) => Id);

  formaNodes.forEach((node: any) => {
    node.InputValue = "";
  });

  inputs.forEach((input: any) => {
    if (nodeIds.includes(input.Id)) {
      input.Value = "";
    }
  });

  graph.Thumbnail = "";

  return graph;
}
