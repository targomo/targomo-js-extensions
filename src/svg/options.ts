const COLORS: {[index: number]: string} = { // test
}

// test
; ['#006837', '#39B54A', '#8CC63F', '#F7931E', '#F15A24', '#C1272D'].forEach((color, i) => {
  COLORS[(i + 1) * 300] = color
})

export class PolygonRenderOptions {
  inverse: boolean = false
  colors: {[edgeWeight: number]: string} = COLORS
  opacity: number = 0.5
  strokeWidth: number = 5
}
