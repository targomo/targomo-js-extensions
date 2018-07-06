import { MultipolygonData, PolygonData } from './types'
import * as geometry from './geometry'

export class ProjectedBounds {
  southWest: ProjectedPoint = new ProjectedPoint(Infinity, Infinity)
  northEast: ProjectedPoint = new ProjectedPoint(-Infinity, -Infinity)

  expandPoint(x: number, y: number) {
    this.southWest.x = Math.min(this.southWest.x, x)
    this.northEast.x = Math.max(this.northEast.x, x)
    this.southWest.y = Math.min(this.southWest.y, y)
    this.northEast.y = Math.max(this.northEast.y, y)
}

  expand(bounds: ProjectedBounds) {
    this.expandPoint(bounds.northEast.x, bounds.northEast.y)
    this.expandPoint(bounds.southWest.x, bounds.southWest.y)
  }
}

export class ProjectedPoint {
  constructor(public x: number, public y: number) {
  }
}

export class ProjectedLineString {
  points: ProjectedPoint[]
  bounds3857: ProjectedBounds = new ProjectedBounds()

  constructor(coordinates: [number, number][]) {
    this.points = coordinates.map(coordinate => {
      this.bounds3857.expandPoint(coordinate[0], coordinate[1])

      const pair = geometry.webMercatorToLeaflet(coordinate[0], coordinate[1], 1)
      return new ProjectedPoint(pair.x, pair.y)
    })
  }
}

export class ProjectedPolygon {
  travelTime: number
  area: number
  lineStrings: ProjectedLineString[]
  bounds3857: ProjectedBounds = new ProjectedBounds()

  constructor(data: PolygonData) {
    this.travelTime = data.travelTime
    this.area = data.area

    this.lineStrings = [new ProjectedLineString(data.outerBoundary)]
    this.bounds3857.expand(this.lineStrings[0].bounds3857)

    if (data.innerBoundary) {
      data.innerBoundary.forEach(innerBoundary => {
        const lineString = new ProjectedLineString(innerBoundary)
        this.lineStrings.push(lineString)
        this.bounds3857.expand(lineString.bounds3857)
      })
    }
  }

  getOuterBoundary() {
    return this.lineStrings[0]
  }

  getInnerBoundary() {
    return this.lineStrings.slice(1)
  }
}

export class ProjectedMultiPolygon {
  polygons: {[travelTime: number]: ProjectedPolygon[]} = {}
  bounds3857: ProjectedBounds = new ProjectedBounds()

  constructor(data: MultipolygonData[]) {
    data.forEach(multipolygonData => {
      multipolygonData.polygons.forEach(polygonData => {
        const polygon = new ProjectedPolygon(polygonData)
        this.polygons[polygon.travelTime] = this.polygons[polygon.travelTime] || []
        this.polygons[polygon.travelTime].push(polygon)
        this.bounds3857.expand(polygon.bounds3857)
      })
    })
  }

  forEach(callback: (travelTime: number, polygon: ProjectedPolygon[]) => void) {
    let keys = Object.keys(this.polygons).map(key => +key).sort((a, b) => b - a)
    keys.forEach(key => callback(+key, this.polygons[<any>key]))
  }
}
