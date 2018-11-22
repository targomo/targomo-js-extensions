import * as L from 'leaflet';

import { TargomoClient, LatLngIdTravelMode, MultigraphRequestOptions } from '@targomo/core';
export class TgmLeafletMultigraphTileLayer {
    tgmClient: TargomoClient;
    layer: any;
    map: L.Map;
    multigraphOptions: MultigraphRequestOptions;
    sources: LatLngIdTravelMode[];
    vectorTileoptions: {vectorTileLayeStyles: any};
    constructor(
        tgmClient: TargomoClient,
        sources: LatLngIdTravelMode[],
        multigraphOptions: MultigraphRequestOptions,
        vectorTileoptions: {vectorTileLayeStyles: any}) {

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

    updateMultigraphOptions(multigraphOptions: MultigraphRequestOptions) {
        this.multigraphOptions = multigraphOptions;
        this.createLayer();
    }
    updateVectorTileOptions(vectorTileoptions: {vectorTileLayeStyles: any}) {
        this.vectorTileoptions = vectorTileoptions;
        this.createLayer();
    }
    updateSources(sources: LatLngIdTravelMode[]) {
        this.sources = sources;
        this.createLayer();
    }

    createLayer() {
        if (this.map && this.layer) {
            this.map.removeLayer(this.layer);
        }

        this.layer = (L as any).vectorGrid.protobuf(
            this.tgmClient.multigraph.getTiledMultigraphUrl(this.sources, this.multigraphOptions, 'mvt'),
            this.vectorTileoptions);

        if (this.map && this.layer) {
            this.layer.addTo(this.map);
        }
    }
}
