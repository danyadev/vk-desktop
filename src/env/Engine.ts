import { MessagesLongpollParams } from 'model/api-types/objects/MessagesLongpollParams'
import { EngineResponse } from 'model/Engine'
import { toUrlParams } from 'misc/utils'

export const ENGINE_VERSION = 19

const ENGINE_MAX_CONNECTION_DURATION_SEC = 20
const ENGINE_FETCH_TIMEOUT = (ENGINE_MAX_CONNECTION_DURATION_SEC + 5) * 1000
const ENGINE_MODE =
  (1 << 1) | // возвращать кладжи
  (1 << 3) | // возвращать расширенную информацию в некоторых событиях
  (1 << 5) | // возвращать pts
  (1 << 7) | // возвращать random_id
  (1 << 9) | // возвращать события о бизнес-уведомлениях
  (1 << 10) // поддержка @online в marked_users

export class Engine {
  active = false
  version = ENGINE_VERSION
  serverParams: MessagesLongpollParams | null = null

  async start(serverParams: MessagesLongpollParams) {
    this.active = true
    this.serverParams = serverParams

    while (this.active) {
      const { server, key, ts } = this.serverParams
      const timeoutSignal = AbortSignal.timeout(ENGINE_FETCH_TIMEOUT)

      const result = await fetch(`https://${server}?act=a_check`, {
        method: 'POST',
        body: toUrlParams({
          key,
          ts,
          version: this.version,
          mode: ENGINE_MODE,
          wait: ENGINE_MAX_CONNECTION_DURATION_SEC
        }),
        signal: timeoutSignal
      }).then<EngineResponse>((response) => response.json())

      if ('failed' in result) {
        switch (result.failed) {
          case 1:
          case 2:
          case 4:
          default:
            throw new Error('[engine] Фейл ' + JSON.stringify(result))
        }
      }

      this.serverParams.ts = result.ts
      this.serverParams.pts = result.pts

      for (const update of result.updates) {
        console.log(update)
      }
    }
  }
}
