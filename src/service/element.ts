import { Forma } from "forma-embedded-view-sdk/auto";

export async function addElement(glb: ArrayBuffer, name?: string) {
  const { fileId } = await Forma.integrateElements.uploadFile({
    authcontext: Forma.getProjectId(),
    data: glb,
  });

  const { urn } = await Forma.integrateElements.createElementHierarchy({
    authcontext: Forma.getProjectId(),
    data: {
      rootElement: "root",
      elements: {
        root: {
          id: "root",
          properties: {
            name,
            geometry: {
              type: "File",
              format: "glb",
              s3Id: fileId,
            },
            elementProvider: "dynamo-player",
          },
        },
      },
    },
  });

  await Forma.proposal.addElement({ urn });
}
