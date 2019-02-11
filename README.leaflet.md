# targomo-js-leaflet
Leaflet extensions for targomo-js

The Targomo Leaflet extensions Typescript library provides extensions for visualising results obtained from the Targomo services. The project is maintained by [Targomo](https://www.targomo.com/). The lib can also be used in non-typescript environments.

# API Key

[Get your free API key by signing up for a Targomo account](https://account.targomo.com/signup?plan=free)

# Getting started

## Usage in TypeScript/ES6 Environments

Install via npm:

```
npm install @targomo/leaflet
```

Example usage for polygon layer

```
  const layer = new tgm.leaflet.TgmLeafletPolygonOverlay()
  layer.addTo(map) // Add to leaflet map

  const polygonData = await targomoClient.polygons.fetch(....) // Fetch polygon data from Targomo service, see @targomo/core lib for more details
  layer.setData(polygonData)  // Visualize received data on layer
}
```


# Docs

More Documentation is available at [https://targomo.com/developers/guide/](https://targomo.com/developers/guide/), although this still contains the documentation for the r360-js lib, until the docs are finished for this lib.