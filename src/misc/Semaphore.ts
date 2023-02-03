export class Semaphore {
  freeOperations: number
  operationsQueue: Array<() => void> = []

  constructor(public operationsPerWindow: number, public windowSizeMilliseconds: number) {
    this.freeOperations = operationsPerWindow
  }

  /**
   * Возвращает true, если операцию можно выполнить сейчас,
   * и false, если ее нужно положить в очередь
   */
  lock() {
    if (this.freeOperations === 0) {
      return false
    }

    this.freeOperations--
    return true
  }

  release() {
    window.setTimeout(() => {
      this.freeOperations = Math.min(this.freeOperations + 1, this.operationsPerWindow)

      const queuedOperation = this.operationsQueue.shift()
      if (queuedOperation) {
        queuedOperation()
      }
    }, this.windowSizeMilliseconds)
  }

  addToQueue(operation: (() => void)) {
    this.operationsQueue.push(operation)
  }
}
