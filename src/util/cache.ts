export class SimpleCache<T> {
  private map: {[index: string]: Promise<T>} = {}

  async get(key: any, factory?: () => Promise<T>): Promise<T> {
    let keyString: string

    if (typeof key === 'string') {
      keyString = key
    } else {
      keyString = JSON.stringify(key)
    }

    if (this.map[keyString] !== undefined) {
      return await this.map[keyString]
    } else {
      const promise = factory()
      this.map[keyString] = promise
      try {
        return await promise
      } catch (e) {
        this.map[keyString] = undefined
      }
    }
  }

  async entries() {
    const result: T[] = []
    for (let key in this.map) {
      result.push(await this.map[key])
    }

    return result
  }
}
