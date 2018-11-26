import {

  LeafletPolygonOverlayOptions,
  TgmLeafletPolygonOverlay,
  TgmLeafletTileLayer

} from '../src/index.leaflet'


describe('Imports', () => {

  test('leaflet imports work', () => {
    expect(LeafletPolygonOverlayOptions).toBeTruthy()
    expect(TgmLeafletPolygonOverlay).toBeTruthy()
    expect(TgmLeafletTileLayer).toBeTruthy()
  })
})
