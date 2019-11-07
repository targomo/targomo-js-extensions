import * as L from 'leaflet';
import 'leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js';

import { TargomoClient } from '@targomo/core';

export class TgmLeafletStatefulMultigraphTileLayer {
    tgmClient: TargomoClient;
    layer: any;
    map: L.Map;
    multigraphId: string;
    vectorTileoptions: {vectorTileLayerStyles: any};

    constructor(
        tgmClient: TargomoClient,
        multigraphId: string,
        vectorTileoptions: {vectorTileLayerStyles: any}) {

        this.tgmClient = tgmClient;
        this.update(multigraphId, vectorTileoptions);
    }

    async addTo(map: L.Map) {
        if (!this.layer) {
            await this.createLayer();
        }
        this.map = map;
        this.layer.addTo(map);
    }

    update(
        multigraphId?: string,
        vectorTileoptions?: {vectorTileLayerStyles: any}
    ): Promise<any>  {
        if (multigraphId) {
            this.multigraphId = multigraphId;
        }
        if (vectorTileoptions) {
            this.vectorTileoptions = vectorTileoptions;
        }

        return this.createLayer();
    }

    async createLayer() {
        if (this.map && this.layer) {
            this.map.removeLayer(this.layer);
        }
        const url = await this.tgmClient.statefulMultigraph.getTiledMultigraphUrl(this.multigraphId, 'mvt');
        this.layer = (L as any).vectorGrid.protobuf(url, this.vectorTileoptions);
        if (this.map && this.layer) {
            this.layer.addTo(this.map);
        }
        return;
    }
}
