const COLORS = ['#006837', '#39B54A', '#8CC63F', '#F7931E', '#F15A24', '#C1272D']
const COLORS_MAP: {[index: number]: string} = {}

COLORS.forEach((color, i) => {
  COLORS_MAP[(i + 1) * 300] = color
})

export interface PolygonRenderColorComplexOption {
  color: string
  opacity?: number
}

function isPolygonRenderColorComplexOption(option: PolygonRenderColorOption): option is PolygonRenderColorComplexOption {
  return option && (option as any).color != null
}

export type PolygonRenderColorOption = PolygonRenderColorComplexOption | string

export class PolygonRenderOptionsData {
  inverse: boolean = false
  // colors: ({[edgeWeight: number]: PolygonRenderColorOption}) | (PolygonRenderColorOption[]) = COLORS
  colors: {[edgeWeight: number]: PolygonRenderColorOption} = COLORS_MAP
  opacity: number = 0.5
  strokeWidth: number = 5
}

export class PolygonRenderOptions extends PolygonRenderOptionsData {
  constructor(data: PolygonRenderOptionsData) {
    super()

    Object.assign(this, data)
  }

  getColorOpacity(travelTime: number, index: number): {color: string, opacity: number} {
    let option: PolygonRenderColorOption = null
    if (this.colors instanceof Array) {
      option = this.colors[index]
    } else {
      option = this.colors[travelTime]
    }

    if (isPolygonRenderColorComplexOption(option)) {
      return {
        color: option.color,
        opacity: option.opacity || 1
      }
    } else {
      return {
        color: option,
        opacity: 1
      }
    }
  }
}
