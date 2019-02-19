
import { TargomoClient, LatLngIdTravelMode, MultigraphRequestOptions, SimpleLRU, RequestsUtil } from '@targomo/core';
import { SimpleCache } from '../util/cache';


export class TgmGoogleMapsMultigraphOverlay implements google.maps.MapType {
  private options: MultigraphRequestOptions
  private visibleTiles = new SimpleCache<google.maps.Data>()
  private requestCache = new SimpleLRU<any>(100)
  private sources: LatLngIdTravelMode[];
  private url: string;
  constructor(
    private map: google.maps.Map,
    public tileSize: google.maps.Size,
    private client: TargomoClient,
    multigraphOptions: MultigraphRequestOptions,
    sources: LatLngIdTravelMode[],
    private styleOptions: google.maps.CircleOptions | google.maps.Data.StyleOptions) {

    this.sources = sources;
    this.options = multigraphOptions;

    // Remove everything from the map when you zoom, getTile will automatically be called to redraw the correct data
    this.map.addListener('zoom_changed', async () => {

     this.clear();
    });

  }

  async clear() {
    // Remove shapes from map
    const currentTiles = this.visibleTiles
    this.visibleTiles = new SimpleCache<google.maps.Data>()
    const entries = await currentTiles.entries()
    entries.forEach(tile => {
      tile.setMap(null)
    })
  }

  async initialize() {
    this.clear();
    this.url = await this.client.multigraph.getTiledMultigraphUrl(this.sources, this.options, 'geojson');
  }

  update(
    multigraphOptions?: MultigraphRequestOptions,
    styleOptions?: google.maps.CircleOptions | google.maps.Data.StyleOptions,
    sources?: LatLngIdTravelMode[]): Promise<any>  {
    if (multigraphOptions) {
        this.options = multigraphOptions;
    }
    if (styleOptions) {
        this.styleOptions = styleOptions;
    }
    if (sources) {
        this.sources = sources;
    }

    return this.initialize();
  }

  getTile(coord: { x: number, y: number }, zoom: number): Element {
    const key = `tile@${zoom}@${coord.x}@${coord.y}`
    this.visibleTiles.get(key, () => this.getAndRenderTile(coord, zoom))
    return null
  }

  private async getAndRenderTile(coord: { x: number, y: number }, zoom: number) {
    const jsonData = await this.fetchTile(coord, zoom)
    const tile = new google.maps.Data({ style: this.styleOptions })
    tile.addGeoJson(jsonData);
    setTimeout(() => {
      tile.setMap(this.map)
    })

    return tile
  }


  private fetchTile(coord: { x: number, y: number }, zoom: number): Promise<any> {
      if (this.url) {
        const url = this.url.replace('{z}', zoom + '')
          .replace('{x}', coord.x + '')
          .replace('{y}', coord.y + '');

        return this.requestCache.get(url, async () => {
          const requests = new RequestsUtil()
          let jsonData = await requests.fetchData(url)

          if (this.options.multigraph.layer.type.toUpperCase() === 'NODE') {
            // Points are difficult to style in google maps so instead we are converting to single point polygons
            jsonData.features.forEach((feature: any) => {
              feature.geometry.type = 'POLYGON'
              feature.geometry.coordinates = [[
                feature.geometry.coordinates, feature.geometry.coordinates, feature.geometry.coordinates
              ]]
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

          return jsonData;
        })
      }
  }

  releaseTile(): void { }
}


