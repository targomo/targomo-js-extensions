import { PolygonOverlayElement } from './polygonOverlayElement'
import { ProjectedBoundsData, ProjectedBounds } from '../geometry/projectedPolygon';
import { geometry, BoundingBox } from '@targomo/core';
import { PolygonRenderOptionsData } from '../svg/options';

describe('abstract layer', () => {
  test('exists', () => {
    expect(PolygonOverlayElement).toBeTruthy()
  })


  test('construct', () => {
    const layer = new PolygonOverlayElement({
      getZoom() {
        return 11
      },

      getViewPort(): ProjectedBoundsData {
        return new ProjectedBounds({
          northEast: geometry.latLngToWebMercator({
            lat: 0,
            lng: 0,
          }),
          southWest: geometry.latLngToWebMercator({
            lat: 1,
            lng: 1,
          })
        })
      },

      getElementPixels(bounds: BoundingBox): ProjectedBoundsData {
        const northEast = {y: 0, x: 0}
        const southWest = {y: 1, x: 1}

        return {northEast, southWest}
      }
    }, new PolygonRenderOptionsData())

    expect(layer).toBeTruthy()
  })
})
