export type MeshGeometry = { vertices: number[]; type: "mesh" };
export type PointGeometry = { points: number[]; type: "point" };
export type CurveGeometry = { points: number[]; isClosed: boolean; type: "curve" };

export function createFeatureCollection(geometry: PointGeometry | CurveGeometry) {
  if (geometry.type === "point") {
    return createFeatureCollectionWithPoints(geometry.points);
  } else if (geometry.isClosed) {
    return createFeatureCollectionWithPolygon(geometry.points);
  }
  return createFeatureCollectionWithLineString(geometry.points);
}

function createFeatureCollectionWithPolygon(points: number[]) {
  function areCoordinatesEqual(coord1: number[], coord2: number[]) {
    return coord1[0] === coord2[0] && coord1[1] === coord2[1];
  }

  const coordinates = groupArr(points, 3).map(([x, y]) => [x, y]);

  // Close the polygon
  if (!areCoordinatesEqual(coordinates[0], coordinates[coordinates.length - 1])) {
    console.log("Closing polygon");
    coordinates.push(coordinates[0]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
        properties: {},
      },
    ],
  };
}

function createFeatureCollectionWithLineString(points: number[]) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: groupArr(points, 3).map(([x, y]) => [x, y]),
        },
        properties: {},
      },
    ],
  };
}

function createFeatureCollectionWithPoints(points: number[]) {
  return {
    type: "FeatureCollection",
    features: groupArr(points, 3).map(([x, y]) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [x, y],
      },
      properties: {},
    })),
  };
}

function groupArr(data: number[], n: number) {
  const group: number[][] = [];
  for (let i = 0, j = 0; i < data.length; i++) {
    if (i >= n && i % n === 0) j++;
    group[j] = group[j] || [];
    group[j].push(data[i]);
  }
  return group;
}
