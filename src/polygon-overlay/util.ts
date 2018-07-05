/// FOR NOW:

import * as polygonUtil from './polygonUtil'
import {r360Point} from './point'
import * as googleUtil from './googleUtil'
import { LineString } from './lineString';

// const options = {
//   scale: 1,
//   tolerance: 100
// }

// function polygonUtil.scale(point: {x: number, y: number}, scale: number) {
//   return r360.point(point.x * scale, point.y * scale);
// }
function getTopRightDecimal(lineString: any) {
  console.log('TOP LEFT', lineString)
  // return r360.Util.webMercatorToLeaflet(this.topRight_3857);
}

/**
* [getBottomLeft4326 description]
* @return {type} [description]
*/
function getBottomLeftDecimal(lineString: any) {
  console.log('BOTTOM RIGHT', lineString)
  // return r360.Util.webMercatorToLatLng(new r360.Point(this.bottomLeft_3857.x, this.bottomLeft_3857.y));
}

function getOuterBoundary(polygon: any) {
  console.log('GET OUTER BOUNDARY', polygon)
  return polygon.lineStrings[0]
}

/**
* [getInnerBoundary description]
* @return {type} [description]
*/
function getInnerBoundary(polygon: any) {
  console.log('GET INNER BOUNDARY', polygon)
  return polygon.lineStrings.slice(1)
}

function createSvgData(polygon: any, options: any) {
  let pathData: any[] = []

  console.log('CREATE SVG DATA', polygon)

  // const topRight   = polygonUtil.scale(getTopRightDecimal(polygon), options.scale);
  // const bottomLeft = polygonUtil.scale(getBottomLeftDecimal(polygon), options.scale);

  // // the outer boundary
  // if ( !(bottomLeft.x > options.bounds.max.x || topRight.x < options.bounds.min.x ||
  //        topRight.y > options.bounds.max.y   || bottomLeft.y < options.bounds.min.y )) {
  //     buildSVGPolygon(pathData, getOuterBoundary(polygon).getCoordinates(), options);
  // }

  // const innerBoundary = getInnerBoundary(polygon)

  // // the inner boundaries
  // for (let i = 0; i < innerBoundary.length; i++) {
  //   let topRightInner     = polygonUtil.scale(getTopRightDecimal(innerBoundary[i]), options.scale);
  //   let bottomLeftInner   = polygonUtil.scale(getBottomLeftDecimal(innerBoundary[i]), options.scale);

  //   if ( !(bottomLeftInner.x > options.bounds.max.x || topRightInner.x < options.bounds.min.x ||
  //           topRightInner.y > options.bounds.max.y   || bottomLeftInner.y < options.bounds.min.y )) {
  //       buildSVGPolygon(pathData, innerBoundary[i].getCoordinates(), options)
  //   }
  // }

  // const topRight   = polygonUtil.scale(getTopRightDecimal(polygon), options.scale);
  // const bottomLeft = polygonUtil.scale(getBottomLeftDecimal(polygon), options.scale);

  // the outer boundary
  // if ( !(bottomLeft.x > options.bounds.max.x || topRight.x < options.bounds.min.x ||
  //        topRight.y > options.bounds.max.y   || bottomLeft.y < options.bounds.min.y )) {
      buildSVGPolygon(pathData, getOuterBoundary(polygon).getCoordinates(), options);
  // }

  const innerBoundary = getInnerBoundary(polygon)

  // the inner boundaries
  for (let i = 0; i < innerBoundary.length; i++) {
    // let topRightInner     = polygonUtil.scale(getTopRightDecimal(innerBoundary[i]), options.scale);
    // let bottomLeftInner   = polygonUtil.scale(getBottomLeftDecimal(innerBoundary[i]), options.scale);

    // if ( !(bottomLeftInner.x > options.bounds.max.x || topRightInner.x < options.bounds.min.x ||
    //         topRightInner.y > options.bounds.max.y   || bottomLeftInner.y < options.bounds.min.y )) {
        buildSVGPolygon(pathData, innerBoundary[i].getCoordinates(), options)
    // }
  }

  return pathData;
}

function buildSVGPolygon(pathData: any, coordinateArray: any, options: any) {
  let point, point1, point2, isCollinear, euclidianDistance, pointCount = 0;
  let boundArray = [[options.bounds.min.x, options.bounds.min.y],
                    [options.bounds.max.x, options.bounds.min.y],
                    [options.bounds.max.x, options.bounds.max.y],
                    [options.bounds.min.x, options.bounds.max.y]];

  let pointsToClip = []

  for (let i = 0; i < coordinateArray.length; i++) {
    point = polygonUtil.scale(r360Point(coordinateArray[i].x, coordinateArray[i].y), options.scale)
    euclidianDistance = (i > 0) ? polygonUtil.getEuclidianDistance(point2, point) : options.tolerance

    if (euclidianDistance >= options.tolerance) {
      isCollinear = false

      if (pointCount > 2) {
        isCollinear = polygonUtil.isCollinear(point1, point2, point)
      }

      if (isCollinear) {
        pointsToClip[pointsToClip.length - 1][0] = point.x
        pointsToClip[pointsToClip.length - 1][1] = point.y
      } else {
        pointsToClip.push([point.x, point.y])
        point1 = point2
        point2 = point
        pointCount++
      }
    }
  }

  let clippedArray = polygonUtil.clip(pointsToClip, boundArray)
  let lastPoint;

  console.log('POINTS TO CLIP', pointsToClip)
  console.log('CLIPPED ARRAY', clippedArray, boundArray)
  clippedArray = pointsToClip
  console.log('CLIPPED ARRAY-2', clippedArray)

  for (let i = 0; i < clippedArray.length; i++) {
    point = r360Point(clippedArray[i][0], clippedArray[i][1])
    // point = polygonUtil.subtract(r360Point(clippedArray[i][0], clippedArray[i][1]),
    //                                     options.pixelOrigin.x + options.offset.x,
    //                                     options.pixelOrigin.y + options.offset.y)

    pathData.push( i > 0 ? polygonUtil.buildPath(point, 'L') : polygonUtil.buildPath(point, 'M'))
    lastPoint = point;
  }

  if (pathData.length > 0) {
    pathData.push(['z']) // svgz
  }

  console.log('PATH DATA', pathData)
  return pathData
}

const generateId = (() => {
  let initial = 0

  return () => 'TGM:' + initial++
}) ()

function createGElement(svgData: any, elementOptions: any) {
  let randomId       = generateId()
  let initialOpacity = elementOptions.opacity

  return `
    <g id="${randomId}" style='opacity: ${initialOpacity}'>
      <path style='stroke: ${elementOptions.color};
            fill: ${elementOptions.color};
            stroke-opacity: 1;
            stroke-width: ${elementOptions.strokeWidth};
            fill-opacity:1'

            d='${svgData.toString().replace(/\,/g, ' ')}'/>
    </g>
  `
}

function getMapPixelBounds(map: google.maps.Map) {
  console.log('map bounds', map.getBounds())
  let bottomLeft = googleUtil.googleLatlngToPoint(map, map.getBounds().getSouthWest(), map.getZoom());
  let topRight   = googleUtil.googleLatlngToPoint(map, map.getBounds().getNorthEast(), map.getZoom());

  return { max : { x : topRight.x, y : bottomLeft.y }, min : { x : bottomLeft.x, y : topRight.y } };
}

function getPixelOrigin(map: google.maps.Map) {
  let viewHalf = polygonUtil.divide({ x : (map.getDiv() as any).offsetWidth, y : (map.getDiv() as any).offsetHeight }, 2)
  let center = googleUtil.googleLatlngToPoint(map, map.getCenter(), map.getZoom())

  return polygonUtil.roundPoint(polygonUtil.subtract(center, viewHalf.x, viewHalf.y));
};


export function polygonToSVG(map: google.maps.Map, multipolygonsData: any[]) {
  let multipolygons = parsePolygon(multipolygonsData)

  let inverse = false
  let color   = 'black' // multiPolygon.getColor && multiPolygon.getColor()
  let strokeWidth = 5

  let options = {
    scale: 1000, // Math.pow(2, map.getZoom()) * 256,
    tolerance: 0,
    color             : inverse ? color : 'black',
    opacity           : inverse ? 1 : 1, // multiPolygon.getOpacity(),
    strokeWidth       : strokeWidth,
    bounds: getMapPixelBounds(map),
    pixelOrigin: getPixelOrigin(map),
}

  let elements: any[] = []
  multipolygons.forEach(multiPolygon => {
    let svgData = multiPolygon.polygons.map((item: any) => createSvgData(item, options))

    if (svgData.length != 0) {
      elements.push(createGElement(svgData, options))
    }
  })

  return elements
}


function parsePolygon(multiPolygonSource: any) {
  let multiPolygon: any[] = []

  multiPolygonSource.forEach((polygonsSource: any) => {
    polygonsSource.polygons.forEach((polygonSource: any) => {
      // create a polygon with the outer boundary as the initial linestring
      // let polygon = r360.polygon(polygonJson.travelTime, polygonJson.area,
      // ew LineString(r360.Util.parseLatLonArray(polygonJson.outerBoundary)));

      // let polygon = r360.polygon(polygonSource.travelTime, polygonSource.area,
      //                   new LineString(parseLatLonArray(polygonSource.outerBoundary)));
      let polygon = {
        travelTime: polygonSource.travelTime,
        area: polygonSource.area,
        lineStrings: [new LineString(parseLatLonArray(polygonSource.outerBoundary))]
      }

      // set color and default to black of not found
      // let var color       = r360.findWhere(r360.config.defaultTravelTimeControlOptions.travelTimes, { time : polygon.getTravelTime() });
      // polygon.setColor(!r360.isUndefined(color) ? color.color : '#000000');
      // // set opacity and default to 1 if not found
      // var opacity = r360.findWhere(r360.config.defaultTravelTimeControlOptions.travelTimes, { time : polygon.getTravelTime() })
      // polygon.setOpacity(!r360.isUndefined(opacity) ? opacity.opacity : 1);

      if (polygonSource.innerBoundary != undefined) {
        // add all inner linestrings to polygon
        for (let k = 0 ; k < polygonSource.innerBoundary.length ; k++ ) {
          // polygon.addInnerBoundary(new LineString(parseLatLonArray(polygonSource.innerBoundary[k])));
          polygon.lineStrings.push(new LineString(parseLatLonArray(polygonSource.innerBoundary[k])));
        }
      }

      polygonUtil.addPolygonToMultiPolygon(multiPolygon, polygon);
    })
  })

  multiPolygon.sort(function(a: any, b: any) { return b.travelTime - a.travelTime; });

  console.log('PASED MULTY', multiPolygon)
  return multiPolygon
}


function parseLatLonArray(latlngs: any[]) {
  let coordinates = new Array()

  for (let i = 0 ; i < latlngs.length ; i++ ) {
      coordinates.push(r360Point(latlngs[i][0], latlngs[i][1]))
  }

  return coordinates;
}
