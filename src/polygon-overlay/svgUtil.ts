import { MultipolygonData, PolygonData } from './types'
import { geometry } from '@targomo/core';

const COLORS: {[index: number]: string} = { // test
}

const transformEPSG3857 = ((a: number, b: number, c: number, d: number) => {
  return function(x: number, y: number, scale: number = 1) {
    x = scale * (a * x + b)
    y = scale * (c * y + d)
    return {x, y}
  }
}) (0.5 / (Math.PI), 0.5, -(0.5 / (Math.PI)), 0.5)
////

function webMercatorToLeaflet(x: number, y: number, scale: number = 1) {
  return transformEPSG3857(x / 6378137, y / 6378137, scale);
}


// test
; ['#006837', '#39B54A', '#8CC63F', '#F7931E', '#F15A24', '#C1272D'].forEach((color, i) => {
  COLORS[(i + 1) * 300] = color
})

const generateId = (() => {
  let initial = 0

  return () => 'TGM:' + initial++
}) ()

function createGElement(svgData: string, elementOptions: {opacity: number, color: string, strokeWidth: number}) {
  let randomId       = generateId()
  let initialOpacity = elementOptions.opacity

  return `
    <g id="${randomId}" style='opacity: ${initialOpacity}'>
      <path style='stroke: ${elementOptions.color};
            fill: ${elementOptions.color};
            stroke-opacity: 1;
            stroke-width: ${elementOptions.strokeWidth};
            fill-opacity:1'

            d='${svgData}'/>
    </g>
  `
}

export function createSVG(multipolygons: MultipolygonData[]): {svg: string, bounds: any} {
  let elements: any[] = []

  let xMin: number = Infinity
  let xMax: number = -Infinity
  let yMin: number = Infinity
  let yMax: number = -Infinity

  let multiPolygonResult: any[] = []

  function parseLatLngArray(coordinates: [number, number][]) {

    coordinates.forEach(coordinate => {
      xMin = Math.min(xMin, coordinate[0])
      xMax = Math.max(xMax, coordinate[0])
      yMin = Math.min(yMin, coordinate[1])
      yMax = Math.max(yMax, coordinate[1])

      const pair = webMercatorToLeaflet(coordinate[0], coordinate[1], 10000000)
      coordinate[0] = Math.round(pair.x)
      coordinate[1] = Math.round(pair.y)
    })

    return coordinates
  }

  function processDataLocal(polygonSource: PolygonData) {
    let polygon = {
      travelTime: polygonSource.travelTime,
      area: polygonSource.area,
      lineStrings: [parseLatLngArray(polygonSource.outerBoundary)]
    }

    if (polygonSource.innerBoundary) {
      polygonSource.innerBoundary.forEach(innerBoundary => {
        polygon.lineStrings.push(parseLatLngArray(innerBoundary))
      })
    }

    addPolygonToMultiPolygon(multiPolygonResult, polygon)
  }

  function createSvgDataLocal(polygon: any) {
    let pathData: any = []

    buildSVGPolygon(pathData, getOuterBoundary(polygon))

    const innerBoundary = getInnerBoundary(polygon)

    for (let i = 0; i < innerBoundary.length; i++) {
      buildSVGPolygon(pathData, innerBoundary[i])
    }

    return pathData
  }

  multipolygons.forEach(multiPolygon => {
    multiPolygon.polygons.map(item => processDataLocal(item))
  })

  multiPolygonResult.sort(function(a: any, b: any) { return b.travelTime - a.travelTime})


  multiPolygonResult.forEach(multiPolygon => {
    console.log('MULTIPOLYGON COLORS', COLORS)
    console.log('MULTIPOLYGON RESULT', multiPolygon)
    console.log('MULTIPOLYGON RESULT COLOR', multiPolygon.travelTime, COLORS[multiPolygon.travelTime])
    let svgData = multiPolygon.polygons.map((item: any) => createSvgDataLocal(item).join(' ')).join(' ')

    if (svgData.length != 0) {
      elements.push(createGElement(svgData, {
        opacity: 1,
        strokeWidth: 5,
        color: COLORS[multiPolygon.travelTime]
      }))
    }
  })

  // let elements: any[] = []
  // multiPolygonResult.forEach(multiPolygon => {
  //   let svgData = multiPolygon.polygons.map((item: any) => createSvgData(item, options))

  //   if (svgData.length != 0) {
  //     elements.push(createGElement(svgData, options))
  //   }
  // })

  const pairMin = webMercatorToLeaflet(xMin, yMin, 10000000)
  const pairMax = webMercatorToLeaflet(xMax, yMax, 10000000)

  if (pairMax.y < pairMin.y) {
    [pairMax.y, pairMin.y] = [pairMin.y, pairMax.y]
  }

  const xMinLeaflet = Math.round(pairMin.x)
  const yMinLeaflet = Math.round(pairMin.y)
  const xMaxLeaflet = Math.round(pairMax.x)
  const yMaxLeaflet = Math.round(pairMax.y)


  console.log('ORIGINAL', yMin, yMax, xMin, xMax)
  console.log('MIN', pairMin)
  console.log('MAX', pairMax)

  const svg = `
    <svg  height="100%" width="100%" viewbox="${xMinLeaflet} ${yMinLeaflet} ${xMaxLeaflet - xMinLeaflet} ${yMaxLeaflet - yMinLeaflet}"
          style='fill:white; opacity: 1; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd'
          xmlns='http://www.w3.org/2000/svg'>
          ${elements.join('\n')}
    </svg>`

  console.log('SVG', svg)

  return {
    svg,
    bounds: {
      xMin, xMax, yMin, yMax,
    }
  }
}


function addPolygonToMultiPolygon(multiPolygons: any, polygon: any) {
  let filteredMultiPolygons = multiPolygons.filter((multiPolygon: any) => multiPolygon.travelTime === polygon.travelTime)

  if (filteredMultiPolygons.length) {
    filteredMultiPolygons[0].polygons.push(polygon)
  } else {
    multiPolygons.push({
      travelTime: polygon.travelTime,
      color: polygon.color,
      opacity: polygon.opacity,
      polygons: [polygon]
    })
  }
}


function buildSVGPolygon(pathData: any[], coordinateArray: [number, number][]) {
  coordinateArray.forEach((point, i) => {
    // console.log('p', geometry.webMercatorToLatLng({x: point[0], y: point[1]}, undefined))
    // console.log('pp', webMercatorToLeaflet(point[0], point[1], 10000000))
    let suffix = i > 0 ? 'L' : 'M'
    const generatedPoint = `${suffix} ${point[0]} ${point[1]}`
    pathData.push(generatedPoint)
  })

  if (pathData.length > 0) {
    pathData.push('z') // svgz
  }

  return pathData
}

function getOuterBoundary(polygon: any) {
  console.log('GET OUTER BOUNDARY__', polygon)
  return polygon.lineStrings[0]
}

/**
* [getInnerBoundary description]
* @return {type} [description]
*/
function getInnerBoundary(polygon: any) {
  console.log('GET INNER BOUNDARY__', polygon)
  return polygon.lineStrings.slice(1)
}
