/// <reference path='../../node_modules/@types/googlemaps/index.d.ts' />

import * as svg from '../render/svg'
import {geometry} from '@targomo/core'
import { MultipolygonData } from '../geometry/types'
import { ProjectedMultiPolygon, ProjectedBounds } from '../geometry/projectedPolygon'
import { MinMaxSchedule } from '../util/minMaxSchedule'

export class GoogleMapsPolygonOverlayOptions extends svg.PolygonRenderOptions {
}

/**
 *
 */
export class TgmGoogleMapsPolygonOverlay extends google.maps.OverlayView {
  private divElement: HTMLDivElement
  private dataBounds: google.maps.LatLngBounds
  private model: ProjectedMultiPolygon
  private renderTimeout: MinMaxSchedule = new MinMaxSchedule()

  private readyResolve: () => void
  private readyPromise = new Promise(resolve => this.readyResolve = resolve)

  /**
   *
   * @param map
   */
  constructor(private map: google.maps.Map, private options?: Partial<GoogleMapsPolygonOverlayOptions>) {
    super()

    this.options = Object.assign(new GoogleMapsPolygonOverlayOptions(), options || {})
    this.setMap(map)
  }

  /**
   *
   */
  draw() {
    this.resize()
    this.renderTimeout.schedule(() => this.render())
  }

  private resize() {
    if (!this.dataBounds || !this.divElement) {
      return
    }

    const overlayProjection = this.getProjection()
    const sw = overlayProjection.fromLatLngToDivPixel(this.dataBounds.getSouthWest())
    const ne = overlayProjection.fromLatLngToDivPixel(this.dataBounds.getNorthEast())

    const div = this.divElement
    div.style.left = sw.x + 'px'
    div.style.top = ne.y + 'px'
    div.style.width = (ne.x - sw.x) + 'px'
    div.style.height = (sw.y - ne.y) + 'px'
  }

  /**
   *
   */
  onAdd() {
    const div = document.createElement('div')
    div.style.borderStyle = 'none'
    div.style.borderWidth = '0px'
    div.style.position = 'absolute'
    div.style.opacity = ('' + this.options.opacity) || '0.5'

    this.divElement = div

    const panes = this.getPanes()
    panes.overlayMouseTarget.appendChild(div)

    this.readyResolve()
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
    this.readyPromise.then(() => {
      this.model = new ProjectedMultiPolygon(multipolygon)
      this.render()
    })
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
    // this.render()

    if (this.divElement) {
      this.divElement.style.opacity = '' + this.options.opacity || '0.5'
    }
  }

  setStrokeWidth(strokeWidth: number) {
    this.options.strokeWidth = strokeWidth
    this.render()
  }

  private getBoundingBox() {
    const bounds = this.map.getBounds()

    return new ProjectedBounds({
      northEast: geometry.latLngToWebMercator({
        lng: bounds.getNorthEast().lng(),
        lat: bounds.getNorthEast().lat(),
      }),
      southWest: geometry.latLngToWebMercator({
        lng: bounds.getSouthWest().lng(),
        lat: bounds.getSouthWest().lat(),
      })
    })
  }

  private render() {
    const inverse = this.options.inverse

    if (!this.model || !this.divElement) {
      return
    }

    const growFactor = Math.min(5, Math.max(2, (this.map.getZoom() - 12) / 2))

    const viewPort = this.getBoundingBox()
    const bounds = new ProjectedBounds(viewPort)

    const projectedMultiPolygon = this.model
    let newBounds = new ProjectedBounds(bounds).growOutwards(growFactor).modifyIntersect(projectedMultiPolygon.bounds3857)

    if (inverse) {
      newBounds.expand(viewPort)
      newBounds.growOutwards(growFactor)
    }

    bounds.growOutwards(growFactor)

    const now = new Date().getTime()
    const zoomFactor = Math.pow(2, this.map.getZoom()) * 256
    const result = svg.render(bounds, newBounds, zoomFactor, projectedMultiPolygon, this.options)
    console.log('**** PROCESSING TIME ****', new Date().getTime() - now)

    this.divElement.innerHTML = result

    const southWest = geometry.webMercatorToLatLng(newBounds.southWest, undefined)
    const northEast = geometry.webMercatorToLatLng(newBounds.northEast, undefined)

    this.dataBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(southWest.lat, southWest.lng),
      new google.maps.LatLng(northEast.lat, northEast.lng)
    )

    this.resize()
  }
}
