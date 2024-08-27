export function transformCoordinates(mat1: number[], coordinates: number[][]) {
  const res = Array<[number, number]>(coordinates.length);
  let i, j, k;
  for (k = 0; k < coordinates.length; k++) {
    const resItem: [number, number] = [0, 0];
    const point = [...(coordinates[k] as [number, number]), 0, 1];
    for (i = 0; i < 4; i++) {
      for (j = 0; j < 2; j++) {
        resItem[j] += mat1[i * 4 + j]! * point[i]!;
      }
    }
    res[k] = resItem;
  }
  return res;
}
