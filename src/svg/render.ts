import * as geometry from '../geometry/projection'
import { ProjectedMultiPolygon, ProjectedPolygon, ProjectedPoint, ProjectedBounds } from '../geometry/projectedPolygon';
import * as simplify from '../geometry/clip'
// import * as collinear from '../geometry/collinear'
import { PolygonRenderOptions } from './options'
export { PolygonRenderOptionsData } from './options'

let idCounter = 0

function renderPath(svgData: string, elementOptions: {opacity: number, color: string, strokeWidth: number}) {
  let initialOpacity = elementOptions.opacity

  return `
    <g style='opacity: ${initialOpacity}'>
      <path style='stroke: ${elementOptions.color};
            fill: ${elementOptions.color};
            stroke-opacity: ${elementOptions.opacity};
            stroke-width: ${elementOptions.strokeWidth};
            fill-opacity: ${elementOptions.opacity}'

            d='${svgData}'/>
    </g>
  `
}

function renderElement(children: any[], width: number, height: number) {
  return `
    <svg  height="100%" width="100%" viewbox="0 0 ${width} ${height}"
          style='opacity: 1; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd'
          xmlns='http://www.w3.org/2000/svg'>
          ${children.join('\n')}
    </svg>`
}

function renderInverseElement(children: any[], width: number, height: number) {
  let id = 'tgm:inverse:' + idCounter++
  const svgFrame = `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} z`
  const frame = `<path style='mask: url(#mask_${id})' d='${svgFrame}'/>`
  const newSvg = `
    <defs>
      <mask id='mask_${id}'>
          <path style='fill-opacity:1; stroke: white; fill:white;' d='${svgFrame}'/>"
          ${children.join('\n')}
      </mask>
    </defs>
  `

  return  `
    <svg  height="100%" width="100%" viewbox="0 0 ${width} ${height}"
          style='opacity: 1; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd'
          xmlns='http://www.w3.org/2000/svg'>
          ${frame}
          ${newSvg}
    </svg>`
}

/**
 *
 * @param viewport
 * @param bounds3857
 * @param zoomFactor
 * @param multipolygons
 */
export function render(viewport: ProjectedBounds,
                       bounds3857: ProjectedBounds,
                       zoomFactor: number,
                       multipolygons: ProjectedMultiPolygon,
                       options: PolygonRenderOptions
                      ) {
  const pairMin = geometry.webMercatorToLeaflet(bounds3857.southWest.x, bounds3857.southWest.y, zoomFactor)
  const pairMax = geometry.webMercatorToLeaflet(bounds3857.northEast.x, bounds3857.northEast.y, zoomFactor)

  if (pairMax.y < pairMin.y) {
    [pairMax.y, pairMin.y] = [pairMin.y, pairMax.y]
  }

  const xMinLeaflet = Math.floor(pairMin.x)
  const yMinLeaflet = Math.floor(pairMin.y)
  const xMaxLeaflet = Math.ceil(pairMax.x)
  const yMaxLeaflet = Math.ceil(pairMax.y)


  let projectedViewport = new ProjectedBounds(viewport)
                            .reproject(geometry.webMercatorToLeaflet)

  let projectedViewportLineString = projectedViewport.toLineString()

  function renderLineString(pathData: any[], points: ProjectedPoint[]) {
    // points = collinear.filterCollinear(points, 1 / (zoomFactor * 100000))
    points = simplify.clip(points, projectedViewportLineString)

    points.forEach((point, i) => {
      let suffix = i > 0 ? 'L' : 'M'
      const x = Math.round((point.x) * zoomFactor) - xMinLeaflet
      const y = Math.round((point.y) * zoomFactor) - yMinLeaflet
      const generatedPoint = `${suffix} ${x} ${y}`
      pathData.push(generatedPoint)
    })

    if (pathData.length > 0) {
      pathData.push('z') // svgz
    }

    return pathData
  }

  function renderPolygon(polygon: ProjectedPolygon) {
    let pathData: any = []

    if (viewport.intersects(polygon.bounds3857)) {
      renderLineString(pathData, polygon.getOuterBoundary().points)
      polygon.getInnerBoundary().forEach(innerBoundary => {
        if (viewport.intersects(innerBoundary.bounds3857)) {
          renderLineString(pathData, innerBoundary.points)
        }
      })
    }

    return pathData
  }

  const children: any[] = []
  multipolygons.forEach((travelTime, polygons, i) => {
    const svgData = polygons.map(item => renderPolygon(item).join(' ')).join(' ')
    if (svgData.length != 0) {
      const polygonOption = options.getColorOpacity(travelTime, i)
      children.push(renderPath(svgData, {
        ...polygonOption,
        strokeWidth: options.strokeWidth,
        color: options.inverse ? 'black' : polygonOption.color
      }))
    }
  })

  let width = Math.ceil(Math.abs(xMaxLeaflet - xMinLeaflet))
  let height = Math.ceil(Math.abs(yMaxLeaflet - yMinLeaflet))

  let content: string
  if (options.inverse) {
    content = renderInverseElement(children, width, height)
  } else {
    content = renderElement(children, width, height)
  }

  return {content, width, height}
}
