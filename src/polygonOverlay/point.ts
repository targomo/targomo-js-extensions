// /*
//  * r360Point represents a point with x and y coordinates.
//  */


// export class Point {
//   constructor(public x: number, public y: number, round: boolean = false) {
//     this.x = (round ? Math.round(x) : x)
//     this.y = (round ? Math.round(y) : y)
//   }

//   clone() {
//       return new Point(this.x, this.y);
//   }

//   // non-destructive, returns a new point
//   add(point: Point) {
//       return this.clone()._add(r360Point(point));
//   }

//   // destructive, used directly for performance in situations where it's safe to modify existing point
//   _add(point: Point) {
//       this.x += point.x;
//       this.y += point.y;
//       return this;
//   }

//   subtract(point: Point) {
//       return this.clone()._subtract(r360Point(point));
//   }

//   _subtract(point: Point) {
//       this.x -= point.x;
//       this.y -= point.y;
//       return this;
//   }

//   divideBy(num: number) {
//       return this.clone()._divideBy(num);
//   }

//   _divideBy(num: number) {
//       this.x /= num;
//       this.y /= num;
//       return this;
//   }

//   multiplyBy(num: number) {
//       return this.clone()._multiplyBy(num);
//   }

//   _multiplyBy(num: number) {
//       this.x *= num;
//       this.y *= num;
//       return this;
//   }

//   round() {
//       return this.clone()._round();
//   }

//   _round() {
//       this.x = Math.round(this.x);
//       this.y = Math.round(this.y);
//       return this;
//   }

//   floor() {
//       return this.clone()._floor();
//   }

//   _floor() {
//       this.x = Math.floor(this.x);
//       this.y = Math.floor(this.y);
//       return this;
//   }

//   ceil() {
//       return this.clone()._ceil();
//   }

//   _ceil() {
//       this.x = Math.ceil(this.x);
//       this.y = Math.ceil(this.y);
//       return this;
//   }

//   distanceTo(point: Point) {
//       point = r360Point(point);

//       let x = point.x - this.x,
//           y = point.y - this.y;

//       return Math.sqrt(x * x + y * y);
//   }

//   equals(point: Point) {
//       point = r360Point(point);

//       return point.x === this.x &&
//              point.y === this.y;
//   }

//   contains(point: Point) {
//       point = r360Point(point);

//       return Math.abs(point.x) <= Math.abs(this.x) &&
//              Math.abs(point.y) <= Math.abs(this.y);
//   }

//   // toString() {
//   //     return 'Point(' +
//   //             r360.Util.formatNum(this.x) + ', ' +
//   //             r360.Util.formatNum(this.y) + ')';
//   // }
// }


// export function r360Point(x: Point): Point
// export function r360Point(x: number[]): Point
// export function r360Point(x: number, y: number, round?: boolean): Point
// export function r360Point(x: number | Point | number[], y?: number, round?: boolean): Point {
//   if (x instanceof Point) {
//     return x
//   }

//   if (x instanceof Array) {
//     return new Point(x[0], x[1])
//   }
//   if (x === undefined || x === null) {
//     return x as any
//   }

//   return new Point(x, y, round);
// }
