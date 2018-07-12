import * as svg from '../svg/render'
import {geometry, BoundingBox} from '@targomo/core'
import { MultipolygonData } from '../geometry/types'
import { ProjectedMultiPolygon, ProjectedBounds, ProjectedBoundsData } from '../geometry/projectedPolygon'
import { MinMaxSchedule } from '../util/minMaxSchedule'


export interface PolygonOverlayElementPlugin {
  getZoom(): number
  getViewPort(): ProjectedBoundsData
  getElementPixels(bounds: BoundingBox): ProjectedBoundsData
}

/**
 *
 */
export class PolygonOverlayElement {
  private divElement: HTMLDivElement
  private bounds: BoundingBox
  private model: ProjectedMultiPolygon
  private renderTimeout: MinMaxSchedule = new MinMaxSchedule()
  private options: svg.PolygonRenderOptions

  /**
   *
   * @param map
   */
  constructor(private plugin: PolygonOverlayElementPlugin,
              options?: Partial<svg.PolygonRenderOptions>) {
    this.options = Object.assign(new svg.PolygonRenderOptions(), options || {})
  }

  getElement() {
    return this.divElement
  }

  /**
   *
   */
  draw() {
    this.resize()
    this.renderTimeout.schedule(() => this.render())
  }

  private resize() {
    if (!this.divElement || !this.bounds) {
      return
    }

    const bounds = this.plugin.getElementPixels(this.bounds)
    const sw = bounds.southWest
    const ne = bounds.northEast

    const div = this.divElement
    div.style.left = sw.x + 'px'
    div.style.top = ne.y + 'px'
    div.style.width = (ne.x - sw.x) + 'px'
    div.style.height = (sw.y - ne.y) + 'px'
  }

  /**
   *
   */
  initElement() {
    const div = document.createElement('div')
    div.style.borderStyle = 'none'
    div.style.borderWidth = '0px'
    div.style.position = 'absolute'
    div.style.opacity = ('' + this.options.opacity) || '0.5'

    this.divElement = div
    return this.divElement
  }

  /**
   *
   */
  onRemove() {
    this.divElement.parentNode.removeChild(this.divElement)
    this.divElement = null
  }

  /**
   *
   * @param multipolygon
   */
  setData(multipolygon: MultipolygonData[]) {
    this.model = new ProjectedMultiPolygon(multipolygon)
    this.render()
  }

  setInverse(inverse: boolean) {
    this.options.inverse = inverse
    this.render()
  }

  setColors(colors: {[edgeWeight: number]: string}) {
    this.options.colors = colors
    this.render()
  }

  setOpacity(opacity: number) {
    this.options.opacity = opacity

    if (this.divElement) {
      this.divElement.style.opacity = '' + this.options.opacity || '0.5'
    }
  }

  setStrokeWidth(strokeWidth: number) {
    this.options.strokeWidth = strokeWidth
    this.render()
  }

  private boundsCalculation(growFactor: number) {
    const projectedMultiPolygon = this.model
    const inverse = this.options.inverse

    const viewPort = new ProjectedBounds(this.plugin.getViewPort()) // .growOutwardsAmount(this.options && this.options.strokeWidth || 0)
    const bounds = new ProjectedBounds(viewPort)
    let newBounds = new ProjectedBounds(bounds).growOutwardsFactor(growFactor).modifyIntersect(projectedMultiPolygon.bounds3857)

    if (inverse) {
      newBounds.expand(viewPort)
      newBounds.growOutwardsFactor(growFactor)
    }

    bounds.growOutwardsFactor(growFactor)

    // pixel to
    const southWest = geometry.webMercatorToLatLng(viewPort.southWest, undefined)
    const northEast = geometry.webMercatorToLatLng(viewPort.northEast, undefined)
    const newPixelBounds = this.plugin.getElementPixels({southWest, northEast})
    const ratio = Math.abs((viewPort.northEast.x - viewPort.southWest.x) / newPixelBounds.northEast.x - newPixelBounds.southWest.x)
    newBounds.growOutwardsAmount(this.options && (ratio * this.options.strokeWidth) || 0)
    //

    return {bounds, newBounds}
  }

  private render() {
    const inverse = this.options.inverse

    if (!this.model || !this.divElement) {
      return
    }

    const zoom = this.plugin.getZoom()
    let zoomFactor = Math.pow(2, zoom) * 256
    zoomFactor = Math.min(10000000, zoomFactor)

    const growFactor = Math.min(5, Math.max(2, (zoom - 12) / 2))
    const {bounds, newBounds} = this.boundsCalculation(growFactor)

    const now = new Date().getTime()
    const result = svg.render(bounds, newBounds, zoomFactor, this.model, this.options)
    console.log('**** PROCESSING TIME ****', new Date().getTime() - now)

    this.divElement.innerHTML = result

    const southWest = geometry.webMercatorToLatLng(newBounds.southWest, undefined)
    const northEast = geometry.webMercatorToLatLng(newBounds.northEast, undefined)

    this.bounds = {southWest, northEast}
    this.resize()
  }
}
