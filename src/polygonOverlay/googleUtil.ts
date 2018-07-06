// export function googleLatlngToPoint(map: google.maps.Map, latlng: any, z: number) {
//   let normalizedPoint = map.getProjection().fromLatLngToPoint(latlng); // returns x,y normalized to 0~255
//   let scale = Math.pow(2, z);
//   return new google.maps.Point(normalizedPoint.x * scale, normalizedPoint.y * scale)
// }

// /**
// * @param {google.maps.Map} map
// * @param {google.maps.Point} point
// * @param {int} z
// * @return {google.maps.LatLng}
// */
// export function googlePointToLatlng(map: google.maps.Map, point: any, z: number) {
//   let scale = Math.pow(2, z);
//   let normalizedPoint = new google.maps.Point(point.x / scale, point.y / scale);
//   let latlng = map.getProjection().fromPointToLatLng(normalizedPoint);
//   return latlng
// }
