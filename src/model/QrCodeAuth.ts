import * as Auth from 'model/Auth'
import * as IApi from 'model/IApi'
import { getPlatform } from 'misc/utils'
import { APP_VERSION } from 'misc/constants'

const CANCELLED_TIMEOUT_ID = 0

export type QrCodeAuthEvent =
  | { kind: 'UrlUpdated', url: string }
  | { kind: 'UrlInvalidated' }
  | { kind: 'Success', androidToken: string }
  | { kind: 'Error' }

export class QrCodeAuth {
  private timeoutId: number | undefined

  constructor(private api: IApi.Api, private onEvent: (event: QrCodeAuthEvent) => void) {}

  async subscribe() {
    const anonymToken = await Auth.getAnonymToken(this.api)
    const { authUrl, authHash } = await this.fetchAuthUrl(anonymToken)

    this.onEvent({ kind: 'UrlUpdated', url: authUrl })
    this.checkStatusLoop(anonymToken, authHash)
  }

  unsubscribe() {
    clearTimeout(this.timeoutId)
    this.timeoutId = CANCELLED_TIMEOUT_ID
  }

  private async fetchAuthUrl(anonymToken: string) {
    const platform = await getPlatform()

    const {
      auth_url: authUrl,
      auth_hash: authHash
    } = await this.api.fetch('auth.getAuthCode', {
      client_id: Auth.ANDROID_CLIENT_ID,
      anonymous_token: anonymToken,
      device_name: `VK Desktop ${APP_VERSION} at ${platform}`
    }, {
      android: true,
      headers: {
        'X-Origin': 'https://vk.com'
      }
    })

    return { authUrl, authHash }
  }

  private async checkStatusLoop(anonymToken: string, authHash: string) {
    try {
      const response = await this.api.fetch('auth.checkAuthCode', {
        anonymous_token: anonymToken,
        auth_hash: authHash
      })

      switch (response.status) {
        case 0: // Created
        case 1: // Opened
          break
        case 2: // Approved
          // Показываем спиннер, чтобы показать, что авторизация продолжается
          this.onEvent({ kind: 'UrlInvalidated' })
          this.onEvent({ kind: 'Success', androidToken: response.access_token })
          return
        case 3: // Declined
          this.onEvent({ kind: 'Error' })
          return
        case 4: { // Expired
          this.onEvent({ kind: 'UrlInvalidated' })

          const { authUrl, authHash: newAuthHash } = await this.fetchAuthUrl(anonymToken)
          authHash = newAuthHash

          this.onEvent({ kind: 'UrlUpdated', url: authUrl })
          break
        }
      }

      if (this.timeoutId === CANCELLED_TIMEOUT_ID) {
        return
      }

      this.timeoutId = window.setTimeout(() => {
        this.checkStatusLoop(anonymToken, authHash)
      }, 3000)
    } catch {
      this.onEvent({ kind: 'Error' })
    }
  }
}
