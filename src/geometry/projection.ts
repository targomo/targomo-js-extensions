const transformEPSG3857 = ((a: number, b: number, c: number, d: number) => {
  return function(x: number, y: number, scale: number = 1) {
    x = scale * (a * x + b)
    y = scale * (c * y + d)
    return {x, y}
  }
}) (0.5 / (Math.PI), 0.5, -(0.5 / (Math.PI)), 0.5)

export function webMercatorToLeaflet(x: number, y: number, scale: number = 1) {
  return transformEPSG3857(x / 6378137, y / 6378137, scale)
}
