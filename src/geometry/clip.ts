import { ProjectedPoint } from './projectedPolygon'

/**
 * [clip clipping like sutherland http://rosettacode.org/wiki/Sutherland-Hodgman_polygon_clipping#JavaScript]
 */
export function clip(subjectPolygon: ProjectedPoint[], clipPolygon: ProjectedPoint[]) {
  let cp1: ProjectedPoint, cp2: ProjectedPoint, s: ProjectedPoint, e: ProjectedPoint

  let inside = function(p: ProjectedPoint) {
    return (cp2.x - cp1.x) * (p.y - cp1.y) > (cp2.y - cp1.y) * (p.x - cp1.x)
  }

  let intersection = function() {
      let dc = new ProjectedPoint(cp1.x - cp2.x, cp1.y - cp2.y),
          dp = new ProjectedPoint(s.x - e.x, s.y - e.y),
          n1 = cp1.x * cp2.y - cp1.y * cp2.x,
          n2 = s.x * e.y - s.y * e.x,
          n3 = 1.0 / (dc.x * dp.y - dc.y * dp.x)

      return new ProjectedPoint((n1 * dp.x - n2 * dc.x) * n3, (n1 * dp.y - n2 * dc.y) * n3)
  }

  let outputList = subjectPolygon
  cp1 = clipPolygon[clipPolygon.length - 1]

  for (let j in clipPolygon) {
      cp2 = clipPolygon[j]

      let inputList = outputList
      outputList = []

      s = inputList[inputList.length - 1] // last on the input list

      for (let i in inputList) {
        e = inputList[i]

          if (inside(e)) {
            if (!inside(s)) {
              outputList.push(intersection())
            }
            outputList.push(e)
          } else if (inside(s)) {
            outputList.push(intersection())
          }
          s = e
      }
      cp1 = cp2
  }

  return outputList
}
