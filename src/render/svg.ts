import * as geometry from '../geometry/projection'
import { ProjectedMultiPolygon, ProjectedPolygon, ProjectedPoint, ProjectedBounds } from '../geometry/projectedPolygon';
import * as simplify from '../geometry/clip'

export interface RenderOptions {
  inverted?: boolean
  colors?: {[edgeWeight: number]: string}
  opacity?: number
  strokeWidth?: number
}

const COLORS: {[index: number]: string} = { // test
}

// test
; ['#006837', '#39B54A', '#8CC63F', '#F7931E', '#F15A24', '#C1272D'].forEach((color, i) => {
  COLORS[(i + 1) * 300] = color
})

function renderPath(svgData: string, elementOptions: {opacity: number, color: string, strokeWidth: number}) {
  let initialOpacity = elementOptions.opacity

  return `
    <g style='opacity: ${initialOpacity}'>
      <path style='stroke: ${elementOptions.color};
            fill: ${elementOptions.color};
            stroke-opacity: 1;
            stroke-width: ${elementOptions.strokeWidth};
            fill-opacity:1'

            d='${svgData}'/>
    </g>
  `
}

function renderElement(children: any[], width: number, height: number) {
  // 0 0 ${xMaxLeaflet - xMinLeaflet} ${yMaxLeaflet - yMinLeaflet}  
  return  `
    <svg  height="100%" width="100%" viewbox="0 0 ${width} ${height}"
          style='opacity: 1; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd'
          xmlns='http://www.w3.org/2000/svg'>
          ${children.join('\n')}
    </svg>`
}

function renderInverseElement(children: any[], width: number, height: number) {
  let id = 'sdfsdfsdfsdf' // FIXME
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
// getInverseSvgElement: function(gElements, options){

//   var svgFrame = r360.PolygonUtil.getSvgFrame(options.svgWidth, options.svgHeight);

//   var svgStart = "<div id=svg_"+ options.id + " style='" + r360.Util.getTranslation(options.offset) + ";''><svg"  +
//                       " height=" + options.svgHeight +
//                       " width="  + options.svgWidth  +
//                       " style='fill:" + options.backgroundColor + " ; opacity: "+ options.backgroundOpacity + "; stroke-width: " + options.strokeWidth + "; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd' xmlns='http://www.w3.org/2000/svg'>"
//   var svgEnd   = "</svg></div>";

//   var newSvg = "<defs>"+
//                   "<mask id='mask_" + options.id + "'>"+
//                       "<path style='fill-opacity:1;stroke: white; fill:white;' d='" + svgFrame.toString().replace(/\,/g, ' ') + "'/>"+
//                           gElements.join('') +
//                   "</mask>"+
//               "</defs>";

//   var frame = "<path style='mask: url(#mask_" + options.id + ")' d='" + svgFrame.toString().replace(/\,/g, ' ') + "'/>";

//   return svgStart + frame + newSvg + svgEnd;
// },

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
                       options: any
                      ): string {
  zoomFactor = Math.min(10000000, zoomFactor)
  const pairMin = geometry.webMercatorToLeaflet(bounds3857.southWest.x, bounds3857.southWest.y, zoomFactor)
  const pairMax = geometry.webMercatorToLeaflet(bounds3857.northEast.x, bounds3857.northEast.y, zoomFactor)

  if (pairMax.y < pairMin.y) {
    [pairMax.y, pairMin.y] = [pairMin.y, pairMax.y]
  }

  const xMinLeaflet = Math.floor(pairMin.x)
  const yMinLeaflet = Math.floor(pairMin.y)
  const xMaxLeaflet = Math.ceil(pairMax.x)
  const yMaxLeaflet = Math.ceil(pairMax.y)


  let projectedViewport = viewport.reproject(geometry.webMercatorToLeaflet)
  let projectedViewportLineString = projectedViewport.toLineString()

  function renderLineString(pathData: any[], points: ProjectedPoint[]) {
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
  multipolygons.forEach((travelTime, polygons) => {
    const svgData = polygons.map(item => renderPolygon(item).join(' ')).join(' ')
    if (svgData.length != 0) {
      children.push(renderPath(svgData, {
        opacity: 1,
        strokeWidth: 5,
        color: COLORS[travelTime]
      }))
    }
  })

  // const svg = `
  //   <svg  height="100%" width="100%" viewbox="${0} ${0} ${xMaxLeaflet - xMinLeaflet} ${yMaxLeaflet - yMinLeaflet}"
  //         style='fill:white; opacity: 1; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd'
  //         xmlns='http://www.w3.org/2000/svg'>
  //         ${elements.join('\n')}
  //   </svg>`

  // console.log('SVG', svg)

  let width = xMaxLeaflet - xMinLeaflet
  let height = yMaxLeaflet - yMinLeaflet
  // return renderElement(children, `0 0 ${xMaxLeaflet - xMinLeaflet} ${yMaxLeaflet - yMinLeaflet}`)
  // return renderElement(children, width, height)
  return renderInverseElement(children, width, height)
}
