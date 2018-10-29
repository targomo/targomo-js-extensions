import { PolygonOverlayElement } from './polygonOverlayElement'
import { ProjectedBoundsData, ProjectedBounds } from '../geometry/projectedPolygon';
import { geometry, BoundingBox } from '@targomo/core';
import { PolygonRenderOptionsData } from '../svg/options';

function constructLayer() {
  return new PolygonOverlayElement({
    getZoom() {
      return 11
    },

    getViewPort(): ProjectedBoundsData {
      return new ProjectedBounds({
        northEast: geometry.latLngToWebMercator({
          lat: 52.6300,
          lng: 13.050,
        }),
        southWest: geometry.latLngToWebMercator({
          lat: 52.2300,
          lng: 13.6050,
        })
      })
    },

    getElementPixels(bounds: BoundingBox): ProjectedBoundsData {
      const northEast = {y: 0, x: 0}
      const southWest = {y: 1, x: 1}

      return {northEast, southWest}
    }
  }, new PolygonRenderOptionsData())

}

describe('abstract layer', () => {
  test('exists', () => {
    expect(PolygonOverlayElement).toBeTruthy()
  })


  test('construct', () => {
    const layer = constructLayer()
    expect(layer).toBeTruthy()
  })


  test('render', () => {
    const layer = constructLayer()
    layer.initElement()
    layer.setData([{
      polygons: [{
        area: 100,
        travelTime: 100,
        outerBoundary: [[52.5300, 13.4050], [52.5200, 13.4050], [52.5300, 13.4000], [52.5300, 13.4050]],
        innerBoundary: []
      }]
    }])


    expect(layer.getElement()).toBeTruthy()
    // expect(layer.getElement().innerHTML).toContain('<svg')
  })
})
