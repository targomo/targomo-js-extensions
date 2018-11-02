import * as L from 'leaflet';
import { TargomoClient, LatLngIdTravelMode, MultigraphRequestOptions } from '@targomo/core';

export class TgmLeafletMultigraphTileLayer extends L.TileLayer {
    tgmClient: TargomoClient;
    config: any;
    constructor(
        tgmClient: TargomoClient,
        leafletTileLayerOptions: L.TileLayerOptions,
        sources: LatLngIdTravelMode[],
        multigraphOptions: MultigraphRequestOptions) {
        super('', leafletTileLayerOptions);

        const options = { ...multigraphOptions, sources: sources };
        this.config = encodeURIComponent(JSON.stringify(options));
        this.tgmClient = tgmClient;
    }

    addTo(map: L.Map | L.LayerGroup): this {
        const jsonLayer = L.geoJSON().addTo(map);
        let zooming = false;
        let responseQueue: any[] = [];
        this.on('tileerror', (event) => {
            const z = (event as any).coords.z;
            const x = (event as any).coords.x;
            const y = (event as any).coords.y;

            const tileUrl = 'https://api.targomo.com/westcentraleurope/v1/multigraph/' + z + '/' + x + '/' + y + '.geojson' +
            '?key=' + this.tgmClient.serviceKey +
            '&cfg=' + this.config

            const xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = (e) => {
                if (xmlhttp.readyState == XMLHttpRequest.DONE) {
                    if (xmlhttp.status == 200) {
                        if (!zooming) {
                            jsonLayer.addData(JSON.parse(xmlhttp.response).data);
                        } else {
                            responseQueue.push(JSON.parse(xmlhttp.response).data);
                        }
                    }
                }
            };
            xmlhttp.open('GET', tileUrl, true);
            xmlhttp.send();
        });

        map.on('zoomstart', () => {
            zooming = true;
        })
        map.on('zoomend', () => {
            jsonLayer.clearLayers();
            zooming = false;
            responseQueue.forEach(response => {
                jsonLayer.addData(response);
            })
            responseQueue = [];
        });

        return super.addTo(map);
    }

    removeFrom(map: L.Map): this {
        map.off('zoomend');
        map.off('zoomstart');
        this.off('tileloadstart');
        return super.removeFrom(map);
    }
}
