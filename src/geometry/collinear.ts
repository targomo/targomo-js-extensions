// import { ProjectedPoint } from './projectedPolygon'

// export function filterCollinear(points: ProjectedPoint[], tolerance: number) {
//   const result: ProjectedPoint[] = []
//   let point1: ProjectedPoint = null
//   let point2: ProjectedPoint = null
//   let pointCount = 0

//   points.forEach((point, i) => {
//     let euclidianDistance = (i > 0) ? point2.distanceTo(point) : tolerance;
//     if (euclidianDistance >= tolerance) {
//       let isCollinear = false

//       if (pointCount > 2) {
//         isCollinear = point.isCollinear(point1, point2, tolerance)
//       }

//       if (isCollinear) {
//         pointsToClip[pointsToClip.length-1][0] = point.x;
//         pointsToClip[pointsToClip.length-1][1] = point.y;
//       } else {
//         result.push(point)
//         point1 = point2
//         point2 = point
//         pointCount++
//       }
//     }
//   })
//   // for ( var i = 0 ; i < coordinateArray.length ; i++ ) {

//   //   point = r360.PolygonUtil.scale(r360.point(coordinateArray[i].x, coordinateArray[i].y), options.scale);

//   //   euclidianDistance = (i > 0) ? r360.PolygonUtil.getEuclidianDistance(point2, point) : options.tolerance;

//   //   if ( euclidianDistance >= options.tolerance ) {

//   //       isCollinear = false;

//   //       if ( pointCount > 2 )
//   //           isCollinear = r360.PolygonUtil.isCollinear(point1, point2, point);

//   //       if ( isCollinear ) {
//   //           pointsToClip[pointsToClip.length-1][0] = point.x;
//   //           pointsToClip[pointsToClip.length-1][1] = point.y;
//   //       }
//   //       else {

//   //           pointsToClip.push([point.x, point.y]);
//   //           point1 = point2;
//   //           point2 = point;
//   //           pointCount++;
//   //       }
//   //   }
// }
