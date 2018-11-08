
import { TargomoClient, LatLngIdTravelMode, MultigraphRequestOptions, SimpleLRU, RequestsUtil } from '@targomo/core';

interface TileData {
  jsonData: any,
}

interface TileRendered {
  data: google.maps.Data,
  circles: google.maps.Circle[],
  tileData: TileData,
}

export class SimpleCache<T> {
  private map: {[index: string]: Promise<T>} = {}

  async get(key: any, factory?: () => Promise<T>): Promise<T> {
    let keyString: string

    if (typeof key === 'string') {
      keyString = key
    } else {
      keyString = JSON.stringify(key)
    }

    if (this.map[keyString] !== undefined) {
      return await this.map[keyString]
    } else {
      const promise = factory()
      this.map[keyString] = promise
      try {
        return await promise
      } catch (e) {
        this.map[keyString] = undefined
      }
    }
  }

  entries() {
    return Object.values(this.map)
  }
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
  private renderedCache = new SimpleCache<TileRendered>()
  private requestCache = new SimpleLRU<TileData>(200)

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
    this.map.addListener('zoom_changed', () => {

      // Remove shapes from map
      this.renderedCache.entries().forEach(async promise => {
        const entry = await promise
        entry.circles.forEach(circle => circle.setMap(null))
        if (entry.data) {
          entry.data.setMap(null)
        }
      })

      this.renderedCache = new SimpleCache<TileRendered>()
    });
  }

  getTile(coord: { x: number, y: number }, zoom: number): Element {
    const key = `tile@${zoom}@${coord.x}@${coord.y}`
    this.renderedCache.get(key, () => this.getAndRenderTile(coord, zoom))
    return null
  }

  private async getAndRenderTile(coord: { x: number, y: number }, zoom: number) {
    // First check if this tile is already loaded in the cache
    const tileData = await this.fetchTile(coord, zoom)

    // Again, because of the memory usage issues, I am removing all the circles in the zoom_changed event listener
    // and recreating it here, otherwise the browser crashes because of memory usage after scrolling in and out
    // ~10 times

    const tile: TileRendered = {
      tileData,
      data: null,
      circles: []
    }

    // const now = new Date().getTime()
    if (this.options.multigraph.layer.type.toUpperCase() === 'NODE-disabled-for-now') {
      setTimeout(() => {
        tileData.jsonData.features.forEach((point: any) => {

          // This part is so that circle styling can use the dynamic styling thingy like:
          // feature.getProperty('w')
          // in the same way as the styling for geojson, so that the user doesnt have to change the styling object
          // when switching from hexagon/tile/edge to node
          point.getProperty = (key: string) => {
            return point.properties[key];
          }

          let style = this.styleOptions as google.maps.CircleOptions;
          if ((style as any).call) {
            style = (this.styleOptions as any)(point);
          };

          const circle = new google.maps.Circle({
            ...style,
            center: { lat: point.geometry.coordinates[1], lng: point.geometry.coordinates[0] },
            map: this.map
          })

          tile.circles.push(circle);
        });
      }, Math.random() * 100)
    } else {
      const data = new google.maps.Data({style: this.styleOptions});
      data.addGeoJson(tileData.jsonData);
      tile.data = data
      setTimeout(() => {
        data.setMap(this.map)
      })
    }

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

      // Don't 100 percent get it, but because the mvt tile format requires some overlap in the hexagons
      // (to prevent hexagons from not showing on the edges between tiles).
      // And for some reason this overlap is also in the geojson format.
      // So here we manually check each hexagon to see if it is actually inside the current tile and
      // only show the hexagons which are inside the tile

      if (this.options.multigraph.layer.type.toUpperCase() === 'NODE') {
        jsonData.features.forEach((feature: any) => {
          feature.geometry.type = 'POLYGON'
          const polygon = [[
            feature.geometry.coordinates, feature.geometry.coordinates, feature.geometry.coordinates
          ]]

          feature.geometry.coordinates = polygon
        })
      }

      if (this.options.multigraph.layer.type.toUpperCase() === 'HEXAGON' ||
          this.options.multigraph.layer.type.toUpperCase() === 'HEXAGON_NODE') {

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


