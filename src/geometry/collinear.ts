import {ProjectedPoint} from './projectedPolygon'

export function filterCollinear(points: ProjectedPoint[], tolerance: number) {
  const result: ProjectedPoint[] = []
  let point1: ProjectedPoint = null
  let point2: ProjectedPoint = null

  points.forEach((point, i) => {
    let euclidianDistance = (i > 0) ? point2.euclideanDistance(point) : tolerance
    if (euclidianDistance >= tolerance) {
      const isCollinear = result.length > 2 && point.isCollinear(point1, point2, tolerance)

      if (isCollinear) {
        result[result.length - 1] = point
      } else {
        result.push(point)
        point1 = point2
        point2 = point
      }
    }
  })

  return result
}
