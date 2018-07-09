import * as geometry from './projection'
import { ProjectedMultiPolygon, ProjectedPolygon, ProjectedPoint, ProjectedBounds } from './projectedPolygon';
import * as simplify from './clip'

const FACTOR = 10000000

const COLORS: {[index: number]: string} = { // test
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

export function render(viewport: ProjectedBounds, multipolygons: ProjectedMultiPolygon): {svg: string, bounds3857: ProjectedBounds} {
  const elements: any[] = []

  let projectedViewport = viewport.reproject(geometry.webMercatorToLeaflet).toLineString()
  projectedViewport = projectedViewport.map((point, i) => new ProjectedPoint(Math.round(point.x * FACTOR), Math.round(point.y * FACTOR)))
  console.log('CLIP BY', projectedViewport)

  function buildSVGPolygonInner(pathData: any[], points: ProjectedPoint[]) {
    points = points.map((point, i) => new ProjectedPoint(Math.round(point.x * FACTOR), Math.round(point.y * FACTOR)))
    points = simplify.clip(points, projectedViewport)

    points.forEach((point, i) => {
      let suffix = i > 0 ? 'L' : 'M'
      // const generatedPoint = `${suffix} ${point.x * FACTOR} ${point.y * FACTOR}`
      const generatedPoint = `${suffix} ${point.x} ${point.y}`
      pathData.push(generatedPoint)
    })

    if (pathData.length > 0) {
      pathData.push('z') // svgz
    }

    return pathData
  }

  function createSvgDataLocal(polygon: ProjectedPolygon) {
    let pathData: any = []

    if (viewport.intersects(polygon.bounds3857)) {
      buildSVGPolygonInner(pathData, polygon.getOuterBoundary().points)
      polygon.getInnerBoundary().forEach(innerBoundary => {
        if (viewport.intersects(innerBoundary.bounds3857)) {
          buildSVGPolygonInner(pathData, innerBoundary.points)
        }
      })
    }

    return pathData
  }

  multipolygons.forEach((travelTime, polygons) => {
    const svgData = polygons.map(item => createSvgDataLocal(item).join(' ')).join(' ')
    if (svgData.length != 0) {
      elements.push(createGElement(svgData, {
        opacity: 1,
        strokeWidth: 5,
        color: COLORS[travelTime]
      }))
    }
  })

  let xMin = multipolygons.bounds3857.southWest.x
  let yMin = multipolygons.bounds3857.southWest.y
  let xMax = multipolygons.bounds3857.northEast.x
  let yMax = multipolygons.bounds3857.northEast.y

  const pairMin = geometry.webMercatorToLeaflet(xMin, yMin, FACTOR)
  const pairMax = geometry.webMercatorToLeaflet(xMax, yMax, FACTOR)

  if (pairMax.y < pairMin.y) {
    [pairMax.y, pairMin.y] = [pairMin.y, pairMax.y]
  }

  const xMinLeaflet = Math.round(pairMin.x)
  const yMinLeaflet = Math.round(pairMin.y)
  const xMaxLeaflet = Math.round(pairMax.x)
  const yMaxLeaflet = Math.round(pairMax.y)

  const svg = `
    <svg  height="100%" width="100%" viewbox="${xMinLeaflet} ${yMinLeaflet} ${xMaxLeaflet - xMinLeaflet} ${yMaxLeaflet - yMinLeaflet}"
          style='fill:white; opacity: 1; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd'
          xmlns='http://www.w3.org/2000/svg'>
          ${elements.join('\n')}
    </svg>`

  console.log('SVG', svg)

  return {
    svg,
    bounds3857: multipolygons.bounds3857
    // bounds: {
    //   xMin, xMax, yMin, yMax,
    // }
  }
}
