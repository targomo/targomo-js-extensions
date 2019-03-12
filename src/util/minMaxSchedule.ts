export class MinMaxSchedule {
  private shortTimeout: any
  private longTimeout: any

  constructor(private min: number = 200, private max: number = 700) {
  }

  schedule(callback: () => any) {
    const action = () => {
      clearTimeout(this.longTimeout)
      clearTimeout(this.shortTimeout)

      this.longTimeout = null
      this.shortTimeout = null

      callback()
    }

    if (!this.longTimeout) {
      this.longTimeout = setTimeout(action, this.max)
    }

    clearTimeout(this.shortTimeout)
    this.shortTimeout = setTimeout(action, this.min)
  }

  scheduleMaximum(callback: () => any) {
    const action = () => {
      clearTimeout(this.longTimeout)

      this.longTimeout = null

      callback()
    }

    if (!this.longTimeout) {
      this.longTimeout = setTimeout(action, this.max)
    }

    clearTimeout(this.shortTimeout)
  }
}
