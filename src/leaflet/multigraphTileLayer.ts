import * as L from 'leaflet';
import '../../node_modules/leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js';

import { TargomoClient, LatLngIdTravelMode, MultigraphRequestOptions } from '@targomo/core';
export class TgmLeafletMultigraphTileLayer {
    tgmClient: TargomoClient;
    layer: any;
    map: L.Map;
    multigraphOptions: MultigraphRequestOptions;
    sources: LatLngIdTravelMode[];
    vectorTileoptions: {vectorTileLayerStyles: any};
    constructor(
        tgmClient: TargomoClient,
        sources: LatLngIdTravelMode[],
        multigraphOptions: MultigraphRequestOptions,
        vectorTileoptions: {vectorTileLayerStyles: any}) {

        this.tgmClient = tgmClient;
        this.sources = sources;
        this.multigraphOptions = multigraphOptions;
        this.vectorTileoptions = vectorTileoptions;

        this.createLayer();
    }

    addTo(map: L.Map) {
        this.map = map;
        this.layer.addTo(map);
    }

    update(
        multigraphOptions?: MultigraphRequestOptions,
        vectorTileoptions?: {vectorTileLayerStyles: any},
        sources?: LatLngIdTravelMode[]): Promise<any>  {
        if (multigraphOptions) {
            this.multigraphOptions = multigraphOptions;
        }
        if (vectorTileoptions) {
            this.vectorTileoptions = vectorTileoptions;
        }
        if (sources) {
            this.sources = sources;
        }

        return this.createLayer();
    }

    createLayer(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.map && this.layer) {
                this.map.removeLayer(this.layer);
            }
            this.tgmClient.multigraph.getTiledMultigraphUrl(this.sources, this.multigraphOptions, 'mvt').then(url => {
                this.layer = (L as any).vectorGrid.protobuf(
                    url,
                    this.vectorTileoptions);
                if (this.map && this.layer) {
                    this.layer.addTo(this.map);
                }
                resolve();
            })
        })
    }
}
