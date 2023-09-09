export class Semaphore {
  private resources: number
  private queue: Array<() => void> = []

  constructor(
    private readonly capacity: number,
    private readonly window: number
  ) {
    this.resources = capacity
  }

  async lock(): Promise<void> {
    if (this.resources > 0) {
      this.resources--
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    window.setTimeout(() => {
      const nextJob = this.queue.shift()
      if (nextJob) {
        nextJob()
      } else {
        this.resources++
      }
    }, this.window)
  }
}
