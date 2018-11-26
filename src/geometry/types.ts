export interface PolygonData {
  area: number,
  travelTime: number,
  outerBoundary: [number, number][]
  innerBoundary: [number, number][][]
}

export interface MultipolygonData {
  polygons: PolygonData[]
}
