global['window']['google'] = global['google'] = {
  maps: {
    OverlayView: {}
  }
}

import {

  GoogleMapsPolygonOverlayOptions,
  TgmGoogleMapsPolygonOverlay

} from '../src/index.googlemaps'


describe('Imports', () => {

  test('google mports work', () => {
    expect(GoogleMapsPolygonOverlayOptions).toBeTruthy()
    expect(TgmGoogleMapsPolygonOverlay).toBeTruthy()

  })
})
