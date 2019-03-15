import * as svg from '../svg/render'
import {geometry, BoundingBox} from '@targomo/core'
import { MultipolygonData } from '../geometry/types'
import { ProjectedMultiPolygon, ProjectedBounds, ProjectedBoundsData } from '../geometry/projectedPolygon'
import { MinMaxSchedule } from '../util/minMaxSchedule'
import { PolygonRenderOptions } from '../svg/options';


export interface PolygonOverlayElementPlugin {
  getZoom(): number
  getViewPort(): ProjectedBoundsData
  getElementPixels(bounds: BoundingBox): ProjectedBoundsData
}

/**
 *
 */
export class PolygonOverlayElement {
  private divElement: HTMLDivElement
  bounds: BoundingBox
  private model: ProjectedMultiPolygon
  private renderTimeout: MinMaxSchedule = new MinMaxSchedule(300, 3000)

  private currentPixelBounds: ProjectedBounds

  /**
   *
   * @param map
   */
  constructor(private plugin: PolygonOverlayElementPlugin,
              private options: svg.PolygonRenderOptionsData) {
  }

  getElement() {
    return this.divElement
  }

  /**
   *
   */
  draw(immediately: boolean = false) {
    if (immediately) {
      this.resize()
      this.render()
      this.divElement.style.transform = null
    } else {
      if (this.divElement && this.bounds) {
        const bounds = new ProjectedBounds(this.plugin.getElementPixels(this.bounds))

        const div = this.divElement
        const dx = Math.round(bounds.left() - this.currentPixelBounds.left())
        const dy = Math.round(bounds.top() - this.currentPixelBounds.top())

        const scaleX = bounds.width() / this.currentPixelBounds.width()
        const scaleY = bounds.height() / this.currentPixelBounds.height()

        if (scaleY !== 1 || scaleX !== 1) {
          div.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale3d(${scaleX}, ${scaleY}, 1)`
        } else if (dx !== 0 || dy !== 0) {
          div.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
        }
      }

      this.renderTimeout.scheduleMaximum(() => {
        this.render()
        this.divElement.style.transform = null
      })
    }
  }

  private resize() {
    if (!this.divElement || !this.bounds) {
      return
    }

    const bounds = this.currentPixelBounds = new ProjectedBounds(this.plugin.getElementPixels(this.bounds))

    const div = this.divElement

    div.style.left = bounds.left() + 'px'
    div.style.top = bounds.top() + 'px'
    div.style.width = bounds.width() + 'px'
    div.style.height = bounds.height() + 'px'
    div.style.transform = null
  }

  /**
   *
   */
  initElement() {
    const div = document.createElement('div')
    div.style.borderStyle = 'none'
    div.style.borderWidth = '0px'
    div.style.position = 'absolute'
    div.style.opacity = ('' + this.options.opacity) || '0.5'

    ; (<any>div).style['backface-visibility'] = 'hidden'
    ; (<any>div).style['perspective'] = 1000
    ; (<any>div).style['transform-origin'] = '0 0 0'
    ; (<any>div).style['will-change'] = 'transform'

    this.divElement = div

    return this.divElement
  }

  /**
   *
   */
  onRemove() {
    this.divElement.parentNode.removeChild(this.divElement)
    this.divElement = null
  }

  /**
   *
   * @param multipolygon
   */
  setData(multipolygon: MultipolygonData[]) {
    if (multipolygon) {
      this.model = new ProjectedMultiPolygon(multipolygon)
    } else {
      this.model = null
    }
    this.render()
  }

  setInverse(inverse: boolean) {
    this.options.inverse = inverse
    this.render()
  }

  setColors(colors: {[edgeWeight: number]: string}) {
    this.options.colors = colors
    this.render()
  }

  setOpacity(opacity: number) {
    this.options.opacity = opacity

    if (this.divElement) {
      this.divElement.style.opacity = '' + this.options.opacity || '0.5'
    }
  }

  setStrokeWidth(strokeWidth: number) {
    this.options.strokeWidth = strokeWidth
    this.render()
  }

  private boundsCalculation(growFactor: number) {
    const projectedMultiPolygon = this.model
    const inverse = this.options.inverse

    const viewPort = new ProjectedBounds(this.plugin.getViewPort()) // .growOutwardsAmount(this.options && this.options.strokeWidth || 0)
    const bounds = new ProjectedBounds(viewPort)
    let newBounds = new ProjectedBounds(bounds).growOutwardsFactor(growFactor).modifyIntersect(projectedMultiPolygon.bounds3857)

    if (inverse) {
      newBounds.expand(viewPort)
      newBounds.growOutwardsFactor(growFactor)
    }

    bounds.growOutwardsFactor(growFactor)

    // pixel to
    const southWest = geometry.webMercatorToLatLng(viewPort.southWest, undefined)
    const northEast = geometry.webMercatorToLatLng(viewPort.northEast, undefined)
    const newPixelBounds = this.plugin.getElementPixels({southWest, northEast})
    const ratio = Math.abs((viewPort.northEast.x - viewPort.southWest.x) / newPixelBounds.northEast.x - newPixelBounds.southWest.x)
    newBounds.growOutwardsAmount(this.options && (ratio * this.options.strokeWidth) || 0)
    //

    return {bounds, newBounds}
  }

  private render(resize = true) {
    // const inverse = this.options.inverse

    if (!this.divElement) {
      return
    }

    if (!this.model) {
      this.divElement.innerHTML = ''
      return
    }

    const zoom = this.plugin.getZoom()
    let zoomFactor = Math.pow(2, zoom) * 256
    zoomFactor = Math.min(10000000, zoomFactor)

    const growFactor = 0.1 // Math.min(5, Math.max(2, (zoom - 12) / 2))
    const {bounds, newBounds} = this.boundsCalculation(growFactor)

    const {content, width, height} = svg.render(bounds, newBounds, zoomFactor, this.model, new PolygonRenderOptions(this.options))
    // const image = new Image(width, height)
    // image.src = `data:image/svg+xml;base64,${btoa(content)}`

    // requestAnimationFrame(() => {
    //   if (resize) {
    //     this.divElement.innerHTML = `<canvas width="${width}" height="${height}"></canvas>`
    //     console.log('new canvas')
    //   }

    //   const context = this.divElement.querySelector('canvas').getContext('2d')
    //   context.drawImage(image, 0, 0)
    // })

      // this.divElement.innerHTML = content
      // image.style.width = '100%'
      // image.style.height = '100%'
      // image.id = 'banana'
      // this.divElement.innerHTML = ''
      // this.divElement.appendChild(image)
    // })
    // console.log('paint2')
    this.divElement.innerHTML = content

    // requestAnimationFrame(() => this.divElement.innerHTML = result)

    const southWest = geometry.webMercatorToLatLng(newBounds.southWest, undefined)
    const northEast = geometry.webMercatorToLatLng(newBounds.northEast, undefined)

    this.bounds = {southWest, northEast}

    if (resize) {
      this.resize()
    }
  }
}
