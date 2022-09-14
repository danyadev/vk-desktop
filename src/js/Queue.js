/* eslint semi: ['error', 'never'] */

import request from './request'
import vkapi from './vkapi'
import { createCallablePromise, toUrlParams } from './utils'

export default class Queue {
  constructor(userId) {
    if (!+userId) {
      throw new Error('param userId is invalid')
    }

    this.userId = +userId
    this.queues = []
    this.baseUrl = null
    this.lastQueueId = 0

    this.running = false
    this.eventHandlers = {}
  }

  getServer(queueQuery) {
    return vkapi('queue.subscribe', {
      queue_ids: queueQuery
    }, { android: 1 })
  }

  getQueueQuery(queueName, queueParams) {
    // 'voting', []     -> 'voting'
    // 'voting', [1, 2] -> 'voting_1_2'
    return queueName + ['', ...queueParams].join('_')
  }

  addApiQueue(queueName, queueParams = []) {
    return this.addApiQueues([[queueName, queueParams]])
  }

  async addApiQueues(queueTupleList, prevQueueId) {
    const queueQueryList = queueTupleList.map(([queueName, queueParams]) => (
      this.getQueueQuery(queueName, queueParams)
    ))
    const queueNames = queueTupleList.map(([queueName]) => queueName)
    const queueId = prevQueueId || ++this.lastQueueId
    const server = await this.getServer(queueQueryList.join(','))

    this.baseUrl = server.base_url

    for (let i = 0; i < server.queues.length; i++) {
      this.queues.push({
        id: queueId,
        name: queueNames[i],
        query: queueQueryList[i],
        key: server.queues[i].key,
        ts: server.queues[i].timestamp,
        refreshQueue: () => {
          for (const queueTuple of queueTupleList) {
            const query = this.getQueueQuery(...queueTuple)
            const index = this.queues.findIndex((queue) => queue.query === query)
            if (index !== -1) {
              this.queue.splice(index, 1)
            }
          }
          return this.addApiQueues(queueTupleList, queueId)
        }
      })
    }
  }

  async performQueueAction(action) {
    const { data } = await request(this.baseUrl, {
      method: 'POST'
    }, {
      timeout: 15000,
      body: toUrlParams({
        act: action,
        key: this.queues.map((queue) => queue.key).join(''),
        ts: this.queues.map((queue) => queue.ts).join('_'),
        id: this.userId,
        wait: 10
      })
    })

    return data
  }

  async loop() {
    if (this.running) {
      throw new Error('Queue loop is already running')
    }
    this.running = true

    while (true) {
      const rawResponse = await this.performQueueAction('a_check')

      if (!this.running) {
        this.stopPromise && this.stopPromise.resolve()
        delete this.stopPromise
        return
      }

      const queuesResponse = Array.isArray(rawResponse) ? rawResponse : [rawResponse]
      const queuesList = this.queues.slice()

      for (const index in queuesResponse) {
        const queueResponse = queuesResponse[index]
        const queue = queuesList[index]

        if (queueResponse.failed) {
          console.warn(`[queue] Failed to check ${queue.query} queue`, queueResponse)
          await queue.refreshQueue()
          continue
        }

        queue.ts = queueResponse.ts
        this.emitEvents(queueResponse.events, queue)
      }
    }
  }

  emitEvents(events, queue) {
    const tryEmitEvent = (eventData, eventType) => {
      try {
        const handlers = [
          ...(this.eventHandlers['*'] || []),
          ...(this.eventHandlers[`queue:${queue.name}`] || []),
          ...(this.eventHandlers[`queue:${queue.name}:${eventType}`] || []),
          ...(this.eventHandlers[eventType] || [])
        ]

        for (const handler of handlers) {
          handler(eventData, eventType, queue)
        }
      } catch (err) {
        console.warn('[queue] Emit event error', err)
      }
    }

    for (const event of events) {
      tryEmitEvent(event.data, event.entity_type)
    }
  }

  on(eventName, handler) {
    if (typeof eventName === 'function') {
      handler = eventName
      eventName = '*'
    }

    (this.eventHandlers[eventName] || (this.eventHandlers[eventName] = [])).push(handler)
  }

  start() {
    this.loop()
  }

  stop() {
    this.stopPromise = this.stopPromise || createCallablePromise()
    this.running = false
    return this.stopPromise
  }
}
