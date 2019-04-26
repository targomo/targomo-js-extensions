# targomo-js-googlemaps
Google Maps extensions for targomo-js

The Targomo Googlemaps extensions Typescript library provides extensions for visualising results obtained from the Targomo services. The project is maintained by [Targomo](https://www.targomo.com/). The lib can also be used in non-typescript environments.

## Standard Polygons
![Google Maps Polygons](googlemaps-polygons.png "Google Maps Polygons")
## Inverse Polygons
![Google Maps Inverse Polygons](googlemaps-inverse.png "Google Maps Inverse Polygons")

# API Key

[Get your free API key by signing up for a Targomo account](https://account.targomo.com/signup?plan=free)

# Regions

The Targomo API is available in many regions. For all available endpoints, see our [availability map](http://targomo.com/developers/availability)

# Getting started

## Usage in TypeScript/ES6 Environments

Install via npm:

```
npm install @targomo/googlemaps
```

Example usage for polygon layer

```
  const layer = new tgm.googlemaps.TgmGoogleMapsPolygonOverlay(map) // Create layer, by passing google map object to constructor

  const polygonData = await targomoClient.polygons.fetch(....) // Fetch polygon data from Targomo service, see @targomo/core lib for more details
  layer.setData(polygonData)  // Visualize received data on layer
}
```


# Docs

More detailed overviews of Targomo's services, along with code examples and demos is available at [https://targomo.com/developers/languages/javascript/](https://targomo.com/developers/languages/javascript/).

Reference docs available [here](https://app.targomo.com/tsdocs/).