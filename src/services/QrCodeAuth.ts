import { Auth } from 'services/Auth'
import * as IApi from 'services/contracts/IApi'
import * as ILang from 'services/contracts/ILang'
import * as IQrCodeAuth from 'services/contracts/IQrCodeAuth'

const STOP_ABORT_REASON = 'QrCodeAuth stopped'

export class QrCodeAuth {
  private timeoutId: number | undefined
  private abortController: AbortController | undefined

  constructor(private auth: Auth, private lang: ILang.Lang) {}

  async start(onEvent: (event: IQrCodeAuth.Event) => void) {
    this.timeoutId = undefined
    this.abortController = new AbortController()

    try {
      const anonymToken = await this.auth.getMessengerAnonymToken(this.abortController.signal)
      const { authUrl, authHash } = await this.auth.getAuthCode(
        anonymToken,
        Auth.MESSENGER_APP_ID,
        Auth.MESSENGER_APP_SCOPE,
        this.abortController.signal
      )

      onEvent({
        kind: 'UrlAcquired',
        url: authUrl
      })
      this.checkStatusLoop(anonymToken, authHash, onEvent)
    } catch (err) {
      if (err instanceof IApi.AbortError && err.reason === STOP_ABORT_REASON) {
        return
      }

      console.warn('[QRCodeAuth] start failed', err)
      onEvent({
        kind: 'Error',
        message: this.getMessageByError(err)
      })
    }
  }

  stop() {
    clearTimeout(this.timeoutId)
    this.abortController?.abort(STOP_ABORT_REASON)
  }

  private async checkStatusLoop(
    anonymToken: string,
    authHash: string,
    onEvent: (event: IQrCodeAuth.Event) => void
  ) {
    try {
      const response = await this.auth.checkAuthCode(
        anonymToken,
        authHash,
        this.abortController?.signal
      )

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

      this.timeoutId = window.setTimeout(() => {
        this.checkStatusLoop(anonymToken, authHash, onEvent)
      }, 5000)
    } catch (err) {
      if (err instanceof IApi.AbortError && err.reason === STOP_ABORT_REASON) {
        return
      }

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
