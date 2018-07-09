/// <reference path='../../node_modules/@types/googlemaps/index.d.ts' />

import * as svg from './svg'
import {geometry} from '@targomo/core'
import { MultipolygonData } from './types';
import { ProjectedMultiPolygon, ProjectedBounds } from './projectedPolygon';

/**
 *
 */
export class TgmPolygonOverlay extends google.maps.OverlayView {
  private divElement: HTMLDivElement
  private dataBounds: google.maps.LatLngBounds
  private model: ProjectedMultiPolygon
  private renderTimeout: any = null

  /**
   *
   * @param map
   */
  constructor(private map: google.maps.Map) {
    super()

    this.setMap(map)
  }

  /**
   *
   */
  draw() {
    console.log('DRAW')
    this.resize()

    clearTimeout(this.renderTimeout)
    this.renderTimeout = setTimeout(() => this.render(), 50)
  }

  private resize() {
    if (!this.dataBounds) {
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
    console.log('ON ADD')
    const div = document.createElement('div')
    div.style.borderStyle = 'none'
    div.style.borderWidth = '0px'
    div.style.position = 'absolute'
    div.style.opacity = '0.7'

    this.divElement = div

    const panes = this.getPanes()
    panes.overlayMouseTarget.appendChild(div)
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
    const now2 = new Date().getTime()
    this.model = new ProjectedMultiPolygon(multipolygon)
    console.log('**** PRE PROCESSING TIME ****', new Date().getTime() - now2)

    this.render()
  }

  private getBoundingBox() {
    const bounds = this.map.getBounds()

    console.log('BIOUNDS', bounds.getNorthEast().lng(), bounds.getSouthWest().lng())

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
    const bounds = this.getBoundingBox()
    console.log('RENDER', bounds)

    if (!this.model) {
      return
    }

    const projectedMultiPolygon = this.model

    const now = new Date().getTime()
    const zoomFactor = Math.pow(2, this.map.getZoom()) * 256
    console.log('ZOOM FACTOR', zoomFactor)
    const result = svg.render(bounds, zoomFactor, projectedMultiPolygon)
    console.log('**** PROCESSING TIME ****', new Date().getTime() - now)

    this.divElement.innerHTML = result

    const southWest = geometry.webMercatorToLatLng(projectedMultiPolygon.bounds3857.southWest, undefined)
    const northEast = geometry.webMercatorToLatLng(projectedMultiPolygon.bounds3857.northEast, undefined)

    this.dataBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(southWest.lat, southWest.lng),
      new google.maps.LatLng(northEast.lat, northEast.lng)
    )

    this.resize()
  }
}
