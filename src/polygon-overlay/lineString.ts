import {r360Point, Point} from './point'
import {geometry, LatLng} from '@targomo/core'


///
    // destructive transform (faster)
    // var scale = 0.5 / (Math.PI);
    // return new r360.Transformation(scale, 0.5, -scale, 0.5);
const transformEPSG3857 = ((a: number, b: number, c: number, d: number) => {
    return function(point: Point, scale: number) {

      scale = scale || 1;
      point.x = scale * (a * point.x + b);
      point.y = scale * (c * point.y + d);
      return point;
  }
}) (0.5 / (Math.PI), 0.5, -(0.5 / (Math.PI)), 0.5)
////

function webMercatorToLeaflet(point: Point) {
  return transformEPSG3857(r360Point(point.x / 6378137, point.y / 6378137), 1);
}

// function webMercatorToLatLng(point: Point, elevation: number) {
//   let latlng = r360.CRS.EPSG3857.projection.unproject(r360Point(point.x, point.y))

//   // x,y,z given so we have elevation data
//   if ( typeof elevation !== 'undefined' ) {
//       return r360.latLng([latlng.lat, latlng.lng, elevation]);
//   // no elevation given, just unproject coordinates to lat/lng
//   } else {
//       return latlng;
//   }
// }

export class LineString {
  private topRight3857: Point
  private bottomLeft3857: Point
  private coordinates: Point[]

  constructor(coordinateArray: any[]) {
    // default min/max values
    this.topRight3857   = r360Point(-20026377, -20048967);
    this.bottomLeft3857 = r360Point(+20026377, +20048967);

    // coordinates in leaflets own system
    this.coordinates = []

    for (let i = coordinateArray.length - 1; i >= 0 ; i--) {
      if (coordinateArray[i].x > this.topRight3857.x) {
        this.topRight3857.x = coordinateArray[i].x
      }

      if (coordinateArray[i].y > this.topRight3857.y) {
        this.topRight3857.y = coordinateArray[i].y
      }

      if (coordinateArray[i].x < this.bottomLeft3857.x) {
        this.bottomLeft3857.x = coordinateArray[i].x
      }

      if (coordinateArray[i].y < this.bottomLeft3857.y) {
        this.bottomLeft3857.y = coordinateArray[i].y
      }
    }

    // TODO refactore, this can be done in a single iteration of the array
    for (let i = 0; i < coordinateArray.length; i++ ) {
      this.coordinates.push(webMercatorToLeaflet(coordinateArray[i]));
    }
  }

  /**
   * [getTopRight4326 description]
   * @return {type} [description]
   */
  getTopRight4326() {
      return geometry.webMercatorToLatLng(r360Point(this.topRight3857.x, this.topRight3857.y), undefined);
  }

  /**
   * [getTopRight3857 description]
   * @return {type} [description]
   */
  getTopRight3857() {
      return this.topRight3857;
  }

  /**
   * [getTopRightDecimal description]
   * @return {type} [description]
   */
  getTopRightDecimal() {
      return webMercatorToLeaflet(this.topRight3857);
  }

  /**
   * [getBottomLeft4326 description]
   * @return {type} [description]
   */
  getBottomLeft4326() {
      return geometry.webMercatorToLatLng(r360Point(this.bottomLeft3857.x, this.bottomLeft3857.y), undefined);
  }

  getBottomLeft3857() {
      return this.bottomLeft3857;
  }

  getBottomLeftDecimal() {
      return webMercatorToLeaflet(this.bottomLeft3857);
  }

  getCoordinates() {
    return this.coordinates;
  }

  getCoordinate(index: number) {
    return this.coordinates[index];
  }
}
