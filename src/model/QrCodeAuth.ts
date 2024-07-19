import * as IApi from 'env/IApi'
import * as ILang from 'env/ILang'
import * as Auth from 'model/Auth'

const CANCELLED_TIMEOUT_ID = 0

export type QrCodeAuthEvent =
  | { kind: 'UrlAcquired', url: string }
  | { kind: 'Success', accessToken: string }
  | { kind: 'Error', message: string }

export class QrCodeAuth {
  private timeoutId: number | undefined

  constructor(private api: IApi.Api, private lang: ILang.Lang) {}

  async start(onEvent: (event: QrCodeAuthEvent) => void) {
    try {
      const anonymToken = await Auth.getMessengerAnonymToken(this.api)
      const { authUrl, authHash } = await Auth.getAuthCode(
        this.api,
        anonymToken,
        Auth.MESSENGER_APP_ID,
        Auth.MESSENGER_APP_SCOPE
      )

      onEvent({
        kind: 'UrlAcquired',
        url: authUrl
      })
      this.checkStatusLoop(anonymToken, authHash, onEvent)
    } catch (err) {
      console.warn('[QRCodeAuth] start failed', err)
      onEvent({
        kind: 'Error',
        message: this.getMessageByError(err)
      })
    }
  }

  stop() {
    clearTimeout(this.timeoutId)
    this.timeoutId = CANCELLED_TIMEOUT_ID
  }

  private async checkStatusLoop(
    anonymToken: string,
    authHash: string,
    onEvent: (event: QrCodeAuthEvent) => void
  ) {
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
          if ('access_token' in response) {
            if (response.is_partial) {
              console.warn('[QRCodeAuth] partial token', response)
              onEvent({
                kind: 'Error',
                message: this.lang.use('auth_get_app_token_error', {
                  description: 'partial token'
                })
              })
            } else {
              onEvent({
                kind: 'Success',
                accessToken: response.access_token
              })
            }
          } else {
            console.warn('[QRCodeAuth] corrupted approve', response)
            onEvent({
              kind: 'Error',
              message: this.lang.use('auth_get_app_token_error', {
                description: 'no access_token'
              })
            })
          }
          return

        case 3: // Declined
          onEvent({
            kind: 'Error',
            message: this.lang.use('auth_qr_code_declined')
          })
          return

        case 4: // Expired
          onEvent({
            kind: 'Error',
            message: this.lang.use('auth_qr_code_expired')
          })
          return
      }

      if (this.timeoutId === CANCELLED_TIMEOUT_ID) {
        return
      }

      this.timeoutId = window.setTimeout(() => {
        this.checkStatusLoop(anonymToken, authHash, onEvent)
      }, 5000)
    } catch (err) {
      console.warn('[QRCodeAuth] loop error', err)
      onEvent({
        kind: 'Error',
        message: this.getMessageByError(err)
      })
    }
  }

  private getMessageByError(err: unknown) {
    if (err instanceof IApi.FetchError) {
      return this.lang.use('auth_network_error')
    }

    return this.lang.use('auth_unknown_error')
  }
}
