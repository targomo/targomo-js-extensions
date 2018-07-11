import * as L from 'leaflet'
import { ProjectedPoint, ProjectedBounds, ProjectedBoundsData } from '../geometry/projectedPolygon';
import {PolygonOverlayElement, PolygonOverlayElementPlugin} from '../overlay/polygonOverlayElement'
import { BoundingBox, geometry } from '@targomo/core';
import { MultipolygonData } from '../geometry/types';

export class TgmLeafletPolygonOverlay extends L.Layer {
  private element: PolygonOverlayElement
  private readyResolve: () => void
  private readyPromise = new Promise(resolve => this.readyResolve = resolve)

  constructor() {
    super()
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
    })

    map.getPanes().overlayPane.appendChild(this.element.initElement())

    map.on('moveend', this.draw, this)
    map.on('resize',  this.draw, this)
    map.on('zoom',  this.draw, this)

    map.on('zoom',  () => {
      console.log('event xoom')
    })

    map.on('zoomanim',  () => {
      console.log('event xoom anim')
    })

    map.on('move',  () => {
      console.log('event move')

    })

    this.readyResolve()
    this.draw()

    return this
  }
}

