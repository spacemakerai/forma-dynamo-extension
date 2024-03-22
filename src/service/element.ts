import { Forma } from "forma-embedded-view-sdk/auto";
import {
  CurveGeometry,
  MeshGeometry,
  PointGeometry,
  createFeatureCollection,
} from "../utils/geojson";

export type CreateIntegrateElement = {
  properties: { [key: string]: any };
  geometry: MeshGeometry | PointGeometry | CurveGeometry;
};

export async function addElement(element: CreateIntegrateElement) {
  let urn;
  if (element.geometry.type == "mesh") {
    urn = await addMeshElement(element.geometry, element.properties);
  } else if (element.geometry.type == "curve" || element.geometry.type == "point") {
    urn = await addGeojsonElement(element.geometry, element.properties);
  } else {
    throw new Error(`Invalid geometry type`);
  }

  await Forma.proposal.addElement({ urn });
}

export async function addMeshElement(
  geometry: MeshGeometry,
  properties: { [key: string]: any } = {},
) {
  const { urn } = await Forma.integrateElements.createElementHierarchy({
    authcontext: Forma.getProjectId(),
    data: {
      rootElement: "root",
      elements: {
        root: {
          id: "root",
          properties: {
            ...properties,
            geometry: {
              type: "Inline",
              format: "Mesh",
              verts: geometry.vertices,
              faces: Array(geometry.vertices.length / 3)
                .fill(0)
                .map((_, i) => i),
            },
            elementProvider: "dynamo-player",
          },
        },
      },
    },
  });

  return urn;
}

export async function addGeojsonElement(
  geometry: CurveGeometry | PointGeometry,
  properties: { [key: string]: any } = {},
) {
  const { urn } = await Forma.integrateElements.createElementHierarchy({
    authcontext: Forma.getProjectId(),
    data: {
      rootElement: "root",
      elements: {
        root: {
          id: "root",
          properties: {
            ...properties,
            geometry: {
              type: "Inline",
              format: "GeoJSON",
              geoJson: createFeatureCollection(geometry) as any,
            },
            elementProvider: "dynamo-player",
          },
        },
      },
    },
  });

  return urn;
}

export async function addGlbElement(glb: ArrayBuffer, name?: string) {
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
