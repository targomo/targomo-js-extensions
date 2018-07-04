/// <reference path='../../node_modules/@types/googlemaps/index.d.ts' />

export class TgmPolygonOverlay extends google.maps.OverlayView {
  private divElement: HTMLDivElement
  private imageElement: HTMLImageElement
  private data: any
  private dataBounds: google.maps.LatLngBounds

  constructor(map: google.maps.Map) {
    super()

    this.setMap(map)
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
    const div = document.createElement('div')
    div.style.borderStyle = 'none'
    div.style.borderWidth = '0px'
    div.style.position = 'absolute'

    const img = document.createElement('img')
    img.src = this.data
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.position = 'absolute'
    div.appendChild(img)

    this.divElement = div

    const panes = this.getPanes()
    panes.overlayMouseTarget.appendChild(div)
  }

  onRemove() {
    this.divElement.parentNode.removeChild(this.divElement)
    this.divElement = null
  }

  setData(multipolygon: any) {
    /// Testing
    this.dataBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(60.626, 25.285),
      new google.maps.LatLng(60.627, 25.29)
    )
  }
}
