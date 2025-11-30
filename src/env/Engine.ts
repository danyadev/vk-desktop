import * as IEngine from 'env/IEngine'
import { MessagesLongpollCredentials } from 'model/api-types/objects/MessagesLongpollCredentials'
import { useConvosStore } from 'store/convos'
import { handleEngineResync, handleEngineUpdates } from 'actions'
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
  credentials: MessagesLongpollCredentials | null = null

  async start(
    credentials: MessagesLongpollCredentials,
    onFail: (reason: IEngine.FailReason) => void
  ) {
    const { api } = useEnv()
    const { connection } = useConvosStore()

    if (this.active) {
      throw new Error('[engine] The engine is already active')
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
          version: IEngine.VERSION,
          mode: ENGINE_MODE,
          wait: ENGINE_MAX_CONNECTION_DURATION_SEC
        }),
        signal: timeoutSignal
      })
        .then<IEngine.Response>((response) => response.json())
        .catch(() => null)

      if (!result) {
        // Получили ошибку сети, просто делаем запрос еще раз
        connection.status = 'syncing'
        await sleep(2500)
        continue
      }

      if ('failed' in result) {
        connection.status = 'syncing'

        switch (result.failed) {
          case 1:
            try {
              this.credentials = await handleEngineResync(IEngine.VERSION, pts)
              connection.status = 'connected'
              continue
            } catch (error) {
              if (error instanceof IEngine.ResyncInvalidateCacheError) {
                onFail(IEngine.FailReason.INVALIDATE_CACHE)
              } else {
                onFail(IEngine.FailReason.RESYNC_ERROR)
              }

              console.error(error)
              throw new Error('[engine] Resync failed')
            }

          case 2: {
            try {
              const { key } = await api.fetch('messages.getLongPollServer', {
                lp_version: IEngine.VERSION,
                need_pts: 0
              }, { retries: Infinity })

              this.credentials.key = key
              connection.status = 'connected'
              continue
            } catch (error) {
              onFail(IEngine.FailReason.RETRIEVE_KEY_ERROR)
              console.error(error)
              throw new Error('[engine] Couldn\'t obtain a new key')
            }
          }

          case 4:
          default:
            onFail(IEngine.FailReason.OTHER)
            throw new Error('[engine] Failed: ' + JSON.stringify(result))
        }
      }

      connection.status = 'connected'
      this.credentials.ts = result.ts
      this.credentials.pts = result.pts

      await handleEngineUpdates(result.updates)
    }
  }

  stop() {
    this.active = false
  }
}
