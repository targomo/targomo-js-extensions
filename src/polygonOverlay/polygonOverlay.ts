/// <reference path='../../node_modules/@types/googlemaps/index.d.ts' />

import * as svgUtil from './svgUtil'
import {geometry} from '@targomo/core'
import { MultipolygonData } from './types';

export class TgmPolygonOverlay extends google.maps.OverlayView {
  private divElement: HTMLDivElement
  private dataBounds: google.maps.LatLngBounds

  constructor(map: google.maps.Map) {
    super()

    this.setMap(map)
  }

  draw() {
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

  onRemove() {
    this.divElement.parentNode.removeChild(this.divElement)
    this.divElement = null
  }

  setData(multipolygon: MultipolygonData[]) {
    // console.log('THIS', this.imageElement)
    const now = new Date().getTime()
    const result = svgUtil.createSVG(multipolygon)
    console.log('**** PROCESSING TIME ****', new Date().getTime() - now)

    this.divElement.innerHTML = result.svg

    const southWest = geometry.webMercatorToLatLng({x: result.bounds.xMin, y: result.bounds.yMin}, undefined)
    const northEast = geometry.webMercatorToLatLng({x: result.bounds.xMax, y: result.bounds.yMax}, undefined)

    this.dataBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(southWest.lat, southWest.lng),
      new google.maps.LatLng(northEast.lat, northEast.lng)
    )

    this.draw()
    return result
  }
}
