import * as geometry from './projection'
import { ProjectedMultiPolygon, ProjectedPolygon, ProjectedPoint, ProjectedBounds } from './projectedPolygon';
import * as simplify from './clip'

// const FACTOR = 10000000

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

export function render(viewport: ProjectedBounds, zoomFactor: number, multipolygons: ProjectedMultiPolygon): string {
  // let xMin = multipolygons.bounds3857.southWest.x
  // let yMin = multipolygons.bounds3857.southWest.y
  // let xMax = multipolygons.bounds3857.northEast.x
  // let yMax = multipolygons.bounds3857.northEast.y

  const pairMin = geometry.webMercatorToLeaflet(multipolygons.bounds3857.southWest.x, multipolygons.bounds3857.southWest.y, zoomFactor)
  const pairMax = geometry.webMercatorToLeaflet(multipolygons.bounds3857.northEast.x, multipolygons.bounds3857.northEast.y, zoomFactor)

  if (pairMax.y < pairMin.y) {
    [pairMax.y, pairMin.y] = [pairMin.y, pairMax.y]
  }

  const xMinLeaflet = Math.floor(pairMin.x)
  const yMinLeaflet = Math.floor(pairMin.y)
  const xMaxLeaflet = Math.ceil(pairMax.x)
  const yMaxLeaflet = Math.ceil(pairMax.y)

  const elements: any[] = []

  zoomFactor = Math.min(10000000, zoomFactor)


  let projectedViewport = viewport.reproject(geometry.webMercatorToLeaflet).toLineString()
  console.log('CLIP BY', projectedViewport)

  function buildSVGPolygonInner(pathData: any[], points: ProjectedPoint[]) {
    points = simplify.clip(points, projectedViewport)

    points.forEach((point, i) => {
      let suffix = i > 0 ? 'L' : 'M'
      const generatedPoint = `${suffix} ${Math.round(point.x * zoomFactor) - xMinLeaflet} ${Math.round(point.y * zoomFactor) - yMinLeaflet}`
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

  // <svg  height="100%" width="100%" viewbox="${xMinLeaflet} ${yMinLeaflet} ${xMaxLeaflet - xMinLeaflet} ${yMaxLeaflet - yMinLeaflet}"
  const svg = `
    <svg  height="100%" width="100%" viewbox="${0} ${0} ${xMaxLeaflet - xMinLeaflet} ${yMaxLeaflet - yMinLeaflet}"
          style='fill:white; opacity: 1; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd'
          xmlns='http://www.w3.org/2000/svg'>
          ${elements.join('\n')}
    </svg>`

  console.log('SVG', svg)

  return svg
}
