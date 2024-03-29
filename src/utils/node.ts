type Input = {
  id: string;
  name: string;
  type: string;
  value: string;
  nodeTypeProperties: {
    options: string[];
    minimumValue: number;
    maximumValue: number;
    stepValue: number;
  };
};

export function isSelect(input: Input) {
  const names = ["Triangles", "Footprint", "Metrics"];
  const types = [
    "FormaSelectMetrics",
    "FormaSelectGeometry",
    "FormaSelectFootprints",
    "FormaSelectElements",
    "FormaSelectElement",
    "SelectElements",
    "SelectMetrics",
  ];

  return names.includes(input.name) || types.includes(input.type);
}

export function isGet(input: Input) {
  const types = ["FormaProject", "FormaTerrain", "GetTerrain", "GetProject"];

  return types.includes(input.type);
}
