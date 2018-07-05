/**
 * [clip clipping like sutherland http://rosettacode.org/wiki/Sutherland-Hodgman_polygon_clipping#JavaScript]
 * @param  {type} subjectPolygon [description]
 * @param  {type} clipPolygon    [description]
 * @return {type}                [description]
 */

import {r360Point} from './point'

const TOLERANCE = 10

export function clip(subjectPolygon: any, clipPolygon: any) {
    let cp1: any
    let cp2: any
    let s: any
    let e: any

    let inside = function (p: any) {
        return (cp2[0] - cp1[0]) * (p[1] - cp1[1]) > (cp2[1] - cp1[1] ) * (p[0] - cp1[0]);
    };
    let intersection = function () {
        let dc = [ cp1[0] - cp2[0], cp1[1] - cp2[1] ],
            dp = [ s[0] - e[0], s[1] - e[1] ],
            n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0],
            n2 = s[0] * e[1] - s[1] * e[0],
            n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0]);
        return [(n1 * dp[0] - n2 * dc[0]) * n3, (n1 * dp[1] - n2 * dc[1]) * n3];
    };
    let outputList = subjectPolygon;
    cp1 = clipPolygon[clipPolygon.length - 1];
    for (let j in clipPolygon) {
        cp2 = clipPolygon[j];
        let inputList = outputList;
        outputList = [];
        s = inputList[inputList.length - 1]; // last on the input list

        for (let i in inputList) {
            e = inputList[i];
            if (inside(e)) {
                if (!inside(s)) {
                    outputList.push(intersection());
                }
                outputList.push(e);
            } else if (inside(s)) {
                outputList.push(intersection());
            }
            s = e;
        }
        cp1 = cp2;
    }
    return outputList
}

/**
 * [isCollinear Checks if the given three points are collinear. Also see
 *     https://en.wikipedia.org/wiki/Collinearity. This method uses a tolerance
 *     factor defined in r360.config.defaultPolygonLayerOptions.tolerance.]
 *
 * @param  {type}  p1 [description]
 * @param  {type}  p2 [description]
 * @param  {type}  p3 [description]
 * @return {Boolean}    [description]
 */
export function isCollinear(p1: any, p2: any, p3: any) {
    if (p1.x == p3.x && p1.y == p3.y) {
        return false;
    }

    if (p1.x == p2.x && p2.x == p3.x) {
        return true;
    }

    if (p1.y == p2.y && p2.y == p3.y) {
        return true;
    }

    let val = (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));

    // if ( val < r360.config.defaultPolygonLayerOptions.tolerance  &&
    //       val > -r360.config.defaultPolygonLayerOptions.tolerance &&
    //       p1.x != p3.x && p1.y != p3.y ) {
    //     return true;
    //       }

          if ( val < TOLERANCE  &&
            val > -TOLERANCE &&
            p1.x != p3.x && p1.y != p3.y ) {
          return true;
            }

    return false;
}

/**
 * [scale Scales a point (x and y coordinate) by the given scale. This method changes
 *     the values of the given point.]
 * @param  {type} point [the point to be scaled]
 * @param  {type} scaleFactor [the scale]
 * @return {type}       [the scaled point]
 */
export function scale(point: any, scaleFactor: any) {
    return r360Point(point.x * scaleFactor, point.y * scaleFactor);
}

/**
 * [subtract Subtracts the given x and y coordinate from the cooresponding values of the given point.
 *     This method changes the values of the given point. ]
 * @param  {type} point [the point to be changed]
 * @param  {type} x     [the x value to be subtracted]
 * @param  {type} y     [the y value to be subtracted]
 * @return {type}       [the subtracted point]
 */
export function subtract(point: any, x: number, y: number) {
    return r360Point(point.x - x, point.y - y);
}

export function divide(point: any, quotient: number) {
    return r360Point(point.x / quotient, point.y / quotient);
}

/**
 * [roundPoint Rounds a point's x and y coordinate. The method changes the x and y
 *     values of the given point. If the fractional portion of number (x and y)
 *     is 0.5 or greater, the argument is rounded to the next higher integer. If the
 *     fractional portion of number is less than 0.5, the argument is rounded to the
 *     next lower integer.]
 *
 * @param  {type} point [the point to rounded]
 * @return {type}       [the point to be rounded with integer x and y coordinate]
 */
export function roundPoint(point: any) {
    point.x = Math.round(point.x);
    point.y = Math.round(point.y);
    return point;
}

/**
 * [buildPath Creates an SVG path. ]
 * @param  {type} point  [The point to add]
 * @param  {type} suffix [The svg suffix for the point]
 * @return {type}        [An array containing the suffix, point.x, point.y]
 */
export function buildPath(point: any, suffix: any) {
    return [suffix, Math.round(point.x), Math.round(point.y)];
}

/**
 * [getEuclidianDistance This method returns the euclidean distance between two points (x and y coordinates).]
 * @param  {type} point1 [the first point]
 * @param  {type} point2 [the second point]
 * @return {type}        [the distance]
 */
export function getEuclidianDistance(point1: any, point2: any) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

/**
 * [getSvgFrame description]
 * @param  {type} width  [description]
 * @param  {type} height [description]
 * @return {type}        [description]
 */
export function getSvgFrame(width: any, height: any) {
    return [['M', 0, 0], ['L', width, 0], ['L', width, height], ['L', 0, height], ['z']];
}

/**
 * [extendBounds description]
 * @param  {type} bounds       [description]
 * @param  {type} extendWidthX [description]
 * @param  {type} extendWidthY [description]
 * @return {type}              [description]
 */
export function extendBounds(bounds: any, extendWidthX: any, extendWidthY: any) {
    let extendX = Math.ceil(extendWidthX);
    let extendY = Math.ceil(extendWidthY);

    bounds.max.x += extendX;
    bounds.min.x -= extendX;
    bounds.max.y += extendY;
    bounds.min.y -= extendY;

    return bounds;
}

/*
  *
  */
export function addPolygonToMultiPolygon(multiPolygons: any, polygon: any) {
    // let filteredMultiPolygons = multiPolygons.filter(
    //   function(multiPolygon: any) { return multiPolygon.getTravelTime() == polygon.travelTime; })

    // // multipolygon with polygon's travetime already there
    // if ( filteredMultiPolygons.length > 0 ) {
    //   filteredMultiPolygons[0].addPolygon(polygon);
    // } else {
    //     let multiPolygon = new r360.multiPolygon();
    //     multiPolygon.setTravelTime(polygon.travelTime);
    //     multiPolygon.addPolygon(polygon);
    //     multiPolygon.setColor(polygon.getColor());
    //     multiPolygon.setOpacity(polygon.getOpacity());
    //     multiPolygons.push(multiPolygon);
    // }

    let filteredMultiPolygons = multiPolygons.filter(
        function(multiPolygon: any) { return multiPolygon.travelTime == polygon.travelTime; })

      // multipolygon with polygon's travetime already there
      if ( filteredMultiPolygons.length > 0 ) {
        filteredMultiPolygons[0].polygons.push(polygon);
      } else {
        //   let multiPolygon = new r360.multiPolygon();
        //   multiPolygon.setTravelTime(polygon.travelTime);
        //   multiPolygon.addPolygon(polygon);
        //   multiPolygon.setColor(polygon.getColor());
        //   multiPolygon.setOpacity(polygon.getOpacity());
        //   multiPolygons.push(multiPolygon);

        multiPolygons.push({
            travelTime: polygon.travelTime,
            color: polygon.color,
            opacity: polygon.opacity,
            polygons: [polygon]
        })
      }
}
