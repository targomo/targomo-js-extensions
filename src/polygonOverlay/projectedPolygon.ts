import { MultipolygonData, PolygonData } from './types'
import * as geometry from './geometry'

export interface ProjectedBounds {
  southWest: ProjectedPoint
  northEast: ProjectedPoint
}

export class ProjectedPoint {
  constructor(public x: number, public y: number) {
  }
}

export class ProjectedLineString {
  points: ProjectedPoint[]
  bounds3857: ProjectedBounds

  constructor(coordinates: [number, number][]) {
    let xMin: number = Infinity
    let xMax: number = -Infinity
    let yMin: number = Infinity
    let yMax: number = -Infinity

    this.points = coordinates.map(coordinate => {
      xMin = Math.min(xMin, coordinate[0])
      xMax = Math.max(xMax, coordinate[0])
      yMin = Math.min(yMin, coordinate[1])
      yMax = Math.max(yMax, coordinate[1])

      const pair = geometry.webMercatorToLeaflet(coordinate[0], coordinate[1], 1)
      return new ProjectedPoint(pair.x, pair.y)
    })

    this.bounds3857 = {
      southWest: new ProjectedPoint(xMin, yMin),
      northEast: new ProjectedPoint(xMax, yMax),
    }
  }
}

export class ProjectedPolygon {
  travelTime: number
  area: number
  lineStrings: ProjectedLineString[]

  constructor(data: PolygonData) {
    this.travelTime = data.travelTime
    this.area = data.area

    this.lineStrings = [new ProjectedLineString(data.outerBoundary)]

    if (data.innerBoundary) {
      data.innerBoundary.forEach(innerBoundary => {
        this.lineStrings.push(new ProjectedLineString(innerBoundary))
      })
    }
  }
}

export class ProjectedMultiPolygon {
  polygons: {[travelTime: number]: ProjectedPolygon[]} = {}

  constructor(data: MultipolygonData[]) {
    data.forEach(multipolygonData => {
      multipolygonData.polygons.forEach(polygonData => {
        const polygon = new ProjectedPolygon(polygonData)
        this.polygons[polygon.travelTime] = this.polygons[polygon.travelTime] || []
        this.polygons[polygon.travelTime].push(polygon)
      })
    })
  }
}
