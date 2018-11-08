
import { TargomoClient, LatLngIdTravelMode, MultigraphRequestOptions } from '@targomo/core';

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
  options: any;
  config: string;
  cache: any[];

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

    // Used to save results, so that you dont re-send requests everytime you zoom
    this.cache = [];

    // Remove everything from the map when you zoom, getTile will automatically be called to redraw the correct data
    this.map.addListener('zoom_changed', () => {
      for (let i in this.cache) {
        this.cache[i].loaded = false;

        this.cache[i].data.setMap(null)

        // For some reason when you just use circle.setMap(null); without completely removing it,
        // and then zooming in and out a couple times, memory use will build up really fast
        // So thats why I am completely removing them. And in getTile new circles are created again.
        this.cache[i].circles.forEach((circle: google.maps.Circle) => {
          circle.setMap(null);
          circle = null;
        })
        this.cache[i].circles = [];
      }
    });
  }

  getTile(coord: { x: number, y: number }, zoom: number): Element {
    // First check if this tile is already loaded in the cache
    const nowMain = new Date().getTime()
    let found = false;
    for (let i in this.cache) {
      if (!found && this.cache[i].x === coord.x && this.cache[i].y === coord.y && this.cache[i].zoom === zoom) {
        found = true;
        // Only add it to the map if this tile is not loaded (added to the map) yet
        if (!this.cache[i].loaded) {

          // This xmlHttpRequest doesnt do much, but for some reason, it seems to be less stutter-ey
          // when zooming in and out (checking the cache and visualizing what it found.) Probably because of threading/async..
          // We have to find a better solution for this.
          // I tried a couple other ways of making this async but I didnt get the same results,
          // I guess the async of xmlhttp is different in some way
          // const xmlhttp = new XMLHttpRequest();
          // xmlhttp.onreadystatechange = (e) => {
          //   if (xmlhttp.readyState == XMLHttpRequest.DONE) {

              // Again, because of the memory usage issues, I am removing all the circles in the zoom_changed event listener
              // and recreating it here, otherwise the browser crashes because of memory usage after scrolling in and out
              // ~10 times
              const now = new Date().getTime()
              if (this.options.multigraph.layer.type.toUpperCase() === 'NODE') {
                this.cache[i].jsonData.features.forEach((point: any) => {

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
                  })
                  this.cache[i].circles.push(circle);
                  circle.setMap(this.map);
                });
              } else {
                this.cache[i].data.setMap(this.map)
              }

              this.cache[i].loaded = true;
              console.log('TIME', new Date().getTime() - now)
            // }
          // };
          // xmlhttp.open('GET', '', true);
          // xmlhttp.send();
        }
      }
      console.log('TIME MAIN', new Date().getTime() - nowMain)
    }

    // Only make a request if the tile is not found in the cache.
    if (!found) {
      const data = new google.maps.Data();
      const circles: any[] = [];
      data.setStyle(this.styleOptions);

      const tileUrl = 'https://api.targomo.com/westcentraleurope/v1/multigraph/' + zoom + '/' + coord.x + '/' + coord.y + '.geojson' +
        '?key=' + this.client.serviceKey +
        '&cfg=' + this.config

      const xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = (e) => {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
          if (xmlhttp.status == 200) {
            let jsonData = JSON.parse(xmlhttp.response).data;

            // Don't 100 percent get it, but because the mvt tile format requires some overlap in the hexagons
            // (to prevent hexagons from not showing on the edges between tiles).
            // And for some reason this overlap is also in the geojson format.
            // So here we manually check each hexagon to see if it is actually inside the current tile and
            // only show the hexagons which are inside the tile
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

            // Not when node, because circles are always re-added on every getTile request (for memory usage reasons)
            if (this.options.multigraph.layer.type.toUpperCase() !== 'NODE') {
              data.addGeoJson(jsonData);
            }

            this.cache.push({
              x: coord.x,
              y: coord.y,
              zoom: zoom,
              data: data,
              circles: circles,
              jsonData: jsonData,
              loaded: false
            })
            this.getTile(coord, zoom);
          }
        }
      };
      xmlhttp.open('GET', tileUrl, true);
      xmlhttp.send();
    }

    return null;
  }

  releaseTile(): void { }
}


