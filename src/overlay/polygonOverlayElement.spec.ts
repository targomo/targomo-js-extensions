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
        northEast: geometry.latLngToWebMercator({lat: 52.554854904263216, lng: 13.529663085937502}),
        southWest: geometry.latLngToWebMercator({lat: 52.47922565896137, lng: 13.216552734375002})
      })
    },

    getElementPixels(bounds: BoundingBox): ProjectedBoundsData {
      const northEast = {x: 2503, y: -199}
      const southWest = {x: -1145, y: 1249}

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
    const data: [number, number][] = [
      [1487953, 6892934],
      [1487953, 6892534],
      [1487553, 6892534],
      [1487953, 6892934],
    ]


    const layer = constructLayer()
    layer.initElement()
    layer.setData([{
      polygons: [{
        area: 100,
        travelTime: 100,
        outerBoundary: data,
        innerBoundary: []
      }]
    }])


    expect(layer.getElement()).toBeTruthy()
    expect(layer.getElement().innerHTML).toContain('<svg')
    expect(layer.getElement().innerHTML).toContain('<path')
  })
})
