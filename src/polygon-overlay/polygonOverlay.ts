/// <reference path='../../node_modules/@types/googlemaps/index.d.ts' />

import {polygonToSVG, polygonToSVGClassic} from './util'
import * as svgUtil from './svgUtil'

export class TgmPolygonOverlay extends google.maps.OverlayView {
  private divElement: HTMLDivElement
  private imageElement: HTMLImageElement
  private data: any = 'http://localhost/embedmap/gold-star.svg'
  private dataBounds: google.maps.LatLngBounds

  constructor(map: google.maps.Map) {
    super()

    this.setMap(map)

    // test
    this.dataBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(52.525595, 13.393085),
      new google.maps.LatLng(52.535595, 13.43085)
    )
  }

  draw() {
    if (!this.data) {
      return
    }

    const overlayProjection = this.getProjection()
    const sw = overlayProjection.fromLatLngToDivPixel(this.dataBounds.getSouthWest())
    const ne = overlayProjection.fromLatLngToDivPixel(this.dataBounds.getNorthEast())

    // Resize the image's div to fit the indicated dimensions.
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

    const img = document.createElement('img')
    img.src = this.data
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.position = 'absolute'
    div.appendChild(img)

    this.imageElement = img
    this.divElement = div

    const panes = this.getPanes()
    panes.overlayMouseTarget.appendChild(div)
  }

  onRemove() {
    this.divElement.parentNode.removeChild(this.divElement)
    this.divElement = null
  }

  setData(multipolygon: any[]) {
    /// Testing
    this.dataBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(52.525595, 13.393085),
      new google.maps.LatLng(52.535595, 13.43085)
    )

    const elements = polygonToSVG(this.getMap() as any, multipolygon)
    const svg = `<svg height="900" width="2143.8"
                      style="fill:#000000;
                      opacity: 0.4; stroke-linejoin:round; stroke-linecap:round; fill-rule: evenodd"
                      xmlns="http://www.w3.org/2000/svg">${elements.join('\n')}</svg>`

    console.log('SVG', svg)

    this.imageElement.src = 'data:image/svg+xml;utf8,' + svg
    // data:image/svg+xml;charset=UTF-8,

    // document.body.appendChild()
    // document.write(svg) /// test
  }

  setDataClassic(r360: any, multipolygon: any[]) {
    console.log('THIS', this.imageElement)
    const result =  polygonToSVGClassic(r360, this.getMap() as any, multipolygon)
    this.imageElement.src = 'data:image/svg+xml;base64,' + atob(result)

    // document.write(result)

    return result
  }

  setDataModern(multipolygon: any[]) {
    console.log('THIS', this.imageElement)
    const result = svgUtil.createSVG(multipolygon)
    // this.imageElement.src = 'data:image/svg+xml;base64,' + atob(result)
    // this.imageElement.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(result)

    this.divElement.innerHTML = result

    // console.log('RESULT', result)
    // document.write(result)

    return result
  }
}
