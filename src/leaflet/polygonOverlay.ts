import * as L from 'leaflet'
import { ProjectedPoint, ProjectedBounds, ProjectedBoundsData } from '../geometry/projectedPolygon';
import {PolygonOverlayElement, PolygonOverlayElementPlugin} from '../overlay/polygonOverlayElement'
import { BoundingBox, geometry } from '@targomo/core';
import { MultipolygonData } from '../geometry/types';
import * as svg from '../svg/render'

export class LeafletPolygonOverlayOptions extends svg.PolygonRenderOptionsData {
}


export class TgmLeafletPolygonOverlay extends L.Layer {
  private element: PolygonOverlayElement
  private readyResolve: () => void
  private readyPromise = new Promise(resolve => this.readyResolve = resolve)
  private options: LeafletPolygonOverlayOptions

  constructor(options?: Partial<LeafletPolygonOverlayOptions>) {
    super()

    this.options = Object.assign(new LeafletPolygonOverlayOptions(), options || {})
  }

  setData(multipolygon: MultipolygonData[]) {
    this.readyPromise.then(() => {
      this.element.setData(multipolygon)
    })
  }

  draw() {
    if (this.element) {
      this.element.draw()
    }
  }

  onAdd(map: L.Map) {
    this.element = new PolygonOverlayElement({
      getZoom() {
        return map.getZoom()
      },

      getViewPort(): ProjectedBoundsData {
        const bounds = map.getBounds()
        return new ProjectedBounds({
          northEast: geometry.latLngToWebMercator({
            lng: bounds.getNorthEast().lng,
            lat: bounds.getNorthEast().lat,
          }),
          southWest: geometry.latLngToWebMercator({
            lng: bounds.getSouthWest().lng,
            lat: bounds.getSouthWest().lat,
          })
        })
      },

      getElementPixels(bounds: BoundingBox): ProjectedBoundsData {
        const northEast = map.latLngToLayerPoint(bounds.northEast)
        const southWest = map.latLngToLayerPoint(bounds.southWest)

        return {northEast, southWest}
      }
    }, this.options)

    const div = this.element.initElement()
    L.DomUtil.addClass(div, 'leaflet-zoom-' + (true ? 'animated' : 'hide'))

    map.getPanes().overlayPane.appendChild(div)

    map.on('moveend', this.draw, this)
    map.on('resize',  this.draw, this)
    map.on('zoom',  this.draw, this)

/*
    map.on('zoomanim', (e: L.ZoomAnimEvent) => {
      console.log('E', e)
      console.log('CURRENT ZOOM', map.getZoom())
      const scale = map.getZoomScale(map.getZoom(), e.zoom)

      console.log('SCALE', scale)
      const offset = (map as any)._getCenterOffset(e.center)._multiplyBy(-scale).subtract((map as any)._getMapPanePos())

      // const div = this.element.getElement()
      L.DomUtil.setTransform(div, offset, scale)

      console.log('AN*****************', div.style.transform)
      // div.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')'
      // console.log('event xoom anim', offset)
    })
    /* */

    this.readyResolve()
    this.draw()

    return this
  }

  setInverse(inverse: boolean) {
    this.options.inverse = inverse
    this.draw()
  }

  setColors(colors: {[edgeWeight: number]: string}) {
    this.options.colors = colors
    this.draw()
  }

  setOpacity(opacity: number) {
    this.options.opacity = opacity

    if (this.element) {
      const div = this.element.getElement()
      div.style.opacity = '' + this.options.opacity || '0.5'
    }
  }

  setStrokeWidth(strokeWidth: number) {
    this.options.strokeWidth = strokeWidth
    this.draw()
  }
}

