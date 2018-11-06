import * as L from 'leaflet';

import { TargomoClient, LatLngIdTravelMode, MultigraphRequestOptions } from '@targomo/core';
export class TgmLeafletMultigraphTileLayer {
    tgmClient: TargomoClient;
    config: any;
    layer: any;
    constructor(
        tgmClient: TargomoClient,
        sources: LatLngIdTravelMode[],
        multigraphOptions: MultigraphRequestOptions,
        vectorTileoptions: {vectorTileLayeStyles: any}) {

        const options = { ...multigraphOptions, sources: sources };
        this.config = encodeURIComponent(JSON.stringify(options));
        this.tgmClient = tgmClient;

        this.layer = (L as any).vectorGrid.protobuf(
            'https://api.targomo.com/westcentraleurope/v1/multigraph/{z}/{x}/{y}.mvt?key=' + this.tgmClient.serviceKey +
            '&cfg=' + this.config, vectorTileoptions)
    }

    addTo(map: L.Map) {
        this.layer.addTo(map);
    }
}
