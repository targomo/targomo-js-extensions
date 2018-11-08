
import { TargomoClient, LatLngIdTravelMode, MultigraphRequestOptions, SimpleLRU, RequestsUtil } from '@targomo/core';
import { SimpleCache } from '../util/cache';

interface TileData {
  jsonData: any,
}

interface TileRendered {
  data: google.maps.Data,
  tileData: TileData,
}

/**
 * use it like:
 * const styleOptions = (feature) => {
    const hue = (1 - (feature.getProperty('w') / max)) * 120;
    return {
      weight: 0,
      fillColor: "hsl(" + hue + ",70%,50%)",
      strokeColor: "hsl(" + hue + ",70%,50%)",

      strokeWeight: 2,
      radius: 10,
      fillOpacity: 0.7,
      strokeOpacity: 1

    };
  };
  const multigraphOverlay = new tgm.googlemaps.MultigraphOverlay(
    this.map,
    new google.maps.Size(256, 256),
    client,
    multigraphOptions,
    sources,
    styleOptions);
  this.map.overlayMapTypes.setAt(0, multigraphOverlay);
 */
export class MultigraphOverlay implements google.maps.MapType {
  private options: any;
  private config: string;
  private visibleTiles = new SimpleCache<TileRendered>()
  private requestCache = new SimpleLRU<TileData>(100)

  constructor(
    private map: google.maps.Map,
    public tileSize: google.maps.Size,
    private client: TargomoClient,
    multigraphOptions: MultigraphRequestOptions,
    sources: LatLngIdTravelMode[],
    private styleOptions: google.maps.CircleOptions | google.maps.Data.StyleOptions) {

    this.options = { ...multigraphOptions, sources: sources };
    // Attatched to the requests as &cfg=
    this.config = encodeURIComponent(JSON.stringify(this.options));

    // Remove everything from the map when you zoom, getTile will automatically be called to redraw the correct data
    this.map.addListener('zoom_changed', async () => {

      // Remove shapes from map
      const currentTiles = this.visibleTiles
      this.visibleTiles = new SimpleCache<TileRendered>()
      const entries = await currentTiles.entries()
      entries.forEach(entry => {
        if (entry.data) {
          entry.data.setMap(null)
        }
      })
    });
  }

  getTile(coord: { x: number, y: number }, zoom: number): Element {
    const key = `tile@${zoom}@${coord.x}@${coord.y}`
    this.visibleTiles.get(key, () => this.getAndRenderTile(coord, zoom))
    return null
  }

  private async getAndRenderTile(coord: { x: number, y: number }, zoom: number) {
    const tileData = await this.fetchTile(coord, zoom)
    const tile: TileRendered = {
      tileData,
      data: null,
    }

    const data = new google.maps.Data({style: this.styleOptions});
    data.addGeoJson(tileData.jsonData);
    tile.data = data
    setTimeout(() => {
      data.setMap(this.map)
    })

    return tile
  }


  private fetchTile(coord: { x: number, y: number }, zoom: number) {
    const baseUrl = 'https://api.targomo.com/westcentraleurope/v1/multigraph/' // TODO get from client
    const tileUrl = baseUrl + zoom + '/' + coord.x + '/' + coord.y + '.geojson' +
                    '?key=' + this.client.serviceKey +
                    '&cfg=' + this.config

    return this.requestCache.get(tileUrl, async () => {
      const requests = new RequestsUtil()
      let jsonData = await requests.fetchData(tileUrl)

      if (this.options.multigraph.layer.type.toUpperCase() === 'NODE') {
        jsonData.features.forEach((feature: any) => {
          feature.geometry.type = 'POLYGON'
          const polygon = [[
            feature.geometry.coordinates, feature.geometry.coordinates, feature.geometry.coordinates
          ]]

          feature.geometry.coordinates = polygon
        })
      } else if (this.options.multigraph.layer.type.toUpperCase() === 'HEXAGON' ||
          this.options.multigraph.layer.type.toUpperCase() === 'HEXAGON_NODE') {

        // Don't 100 percent get it, but because the mvt tile format requires some overlap in the hexagons
        // (to prevent hexagons from not showing on the edges between tiles).
        // And for some reason this overlap is also in the geojson format.
        // So here we manually check each hexagon to see if it is actually inside the current tile and
        // only show the hexagons which are inside the tile

        const newJsonData: { type: string, features: any[] } = { type: 'FeatureCollection', features: [] }
        jsonData.features.forEach((feature: any) => {
          let highestLat: number = undefined;
          let lowestLat: number = undefined;
          let highestLng: number = undefined;
          let lowestLng: number = undefined;
          feature.geometry.coordinates.forEach((coordinates: number[][]) => {
            coordinates.forEach(coordinate => {
              if (!highestLng || coordinate[0] > highestLng) {
                highestLng = coordinate[0];
              }
              if (!lowestLng || coordinate[0] < lowestLng) {
                lowestLng = coordinate[0];
              }
              if (!highestLat || coordinate[1] > highestLat) {
                highestLat = coordinate[1];
              }
              if (!lowestLat || coordinate[1] < lowestLat) {
                lowestLat = coordinate[1];
              }
            })
          })

          if (highestLat && lowestLat && highestLng && lowestLng) {
            const centerLat = lowestLat + ((highestLat - lowestLat) / 2);
            const centerLng = lowestLng + ((highestLng - lowestLng) / 2);

            let nwPixelX = coord.x * 256;
            let nwPixelY = coord.y * 256;
            let sePixelX = (coord.x + 1) * 256 - 1;
            let sePixelY = (coord.y + 1) * 256 - 1;

            let nwWorldX = nwPixelX / (Math.pow(2, zoom));
            let nwWorldY = nwPixelY / (Math.pow(2, zoom));
            let seWorldX = sePixelX / (Math.pow(2, zoom));
            let seWorldY = sePixelY / (Math.pow(2, zoom));

            let nwWorldPoint = new google.maps.Point(nwWorldX, nwWorldY);
            let seWorldPoint = new google.maps.Point(seWorldX, seWorldY);

            let nwLatLng = this.map.getProjection().fromPointToLatLng(nwWorldPoint);
            let seLatLng = this.map.getProjection().fromPointToLatLng(seWorldPoint);

            if (centerLat <= nwLatLng.lat() &&
              centerLat >= seLatLng.lat() &&
              centerLng >= nwLatLng.lng() &&
              centerLng <= seLatLng.lng()) {
              newJsonData.features.push(feature);
            }
          }
        })

        jsonData = newJsonData;
      }

      return {
        jsonData: jsonData,
      }
    })
  }

  releaseTile(): void { }
}


