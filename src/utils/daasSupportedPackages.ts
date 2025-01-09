const SUPPORTED_PACKAGES = [
  "DynamoFormaBeta for 2.x",
  "DynamoFormaBeta",
  "DynamoForma.dll",
  "MeshToolkit",
  "MeshToolkit.dll",
  "Refinery Toolkit",
  "VASA",
  "VASA.dll",
];

export type Package = {
  Name: string;
  Version: string;
  ReferenceType: "Package" | "ZeroTouch";
  Nodes: string[];
};

export function filterUnsupportedPackages(graph: any): Package[] {
  return graph.NodeLibraryDependencies.filter(
    ({ Name }: Package) => !SUPPORTED_PACKAGES.includes(Name),
  ).map(({ Name, Version }: Package) => ({ Name, Version }));
}
