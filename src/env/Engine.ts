import * as IEngine from 'env/IEngine'
import { MessagesLongpollCredentials } from 'model/api-types/objects/MessagesLongpollCredentials'
import { useConvosStore } from 'store/convos'
import { handleEngineUpdates } from 'actions'
import { useEnv } from 'hooks'
import { sleep, toUrlParams } from 'misc/utils'

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
  version = IEngine.VERSION
  credentials: MessagesLongpollCredentials | null = null

  async start(credentials: MessagesLongpollCredentials) {
    const { api } = useEnv()
    const { connection } = useConvosStore()

    if (this.active) {
      throw new Error('[engine] Движок уже запущен')
    }

    this.active = true
    this.credentials = credentials

    while (this.active) {
      const { server, key, ts, pts } = this.credentials
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
      })
        .then<IEngine.Response>((response) => response.json())
        .catch(() => null)

      if (!result) {
        // Получили ошибку сети, просто делаем запрос еще раз
        await sleep(2500)
        continue
      }

      if ('failed' in result) {
        switch (result.failed) {
          case 2: {
            try {
              const { key } = await api.fetch('messages.getLongPollServer', {
                lp_version: this.version,
                need_pts: 0
              }, { retries: Infinity })

              this.credentials.key = key
              continue
            } catch {
              throw new Error('[engine] Couldn\'t obtain a new key')
            }
          }

          case 1:
          case 4:
          default:
            connection.status = 'syncing'
            throw new Error('[engine] Фейл ' + JSON.stringify(result))
        }
      }

      this.credentials.ts = result.ts
      this.credentials.pts = result.pts

      await handleEngineUpdates(pts, result.updates)
    }
  }

  stop() {
    this.active = false
  }
}
