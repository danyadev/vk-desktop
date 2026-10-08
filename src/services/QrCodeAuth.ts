import { Auth } from 'services/Auth'
import { AuthValidateAuthCodeResponse } from 'services/contracts/api/methods/Auth'
import * as IApi from 'services/contracts/IApi'
import * as ILang from 'services/contracts/ILang'
import * as IQrCodeAuth from 'services/contracts/IQrCodeAuth'

const ABORT_REASON_STOP = 'QrCodeAuth stopped'
const ABORT_REASON_HUNG = 'QrCodeAuth hung'

export class QrCodeAuth {
  private anonymToken: string | undefined
  private authHash: string | undefined
  private verificationRequested = false

  private timeoutId: number | undefined
  private abortController: AbortController | undefined

  constructor(private auth: Auth, private lang: ILang.Lang) {}

  async start(onEvent: (event: IQrCodeAuth.Event) => void) {
    this.stop(true)
    this.abortController = new AbortController()

    const { signal } = this.abortController

    try {
      const anonymToken = await this.auth.getMessengerAnonymToken(signal)
      const { authUrl, authHash } = await this.auth.getAuthCode(
        anonymToken,
        Auth.MESSENGER_APP_ID,
        Auth.MESSENGER_APP_SCOPE,
        signal
      )
      signal.throwIfAborted()

      this.anonymToken = anonymToken
      this.authHash = authHash

      onEvent({
        kind: 'UrlAcquired',
        url: authUrl
      })
      this.checkStatusLoop(anonymToken, authHash, onEvent, signal)
    } catch (err) {
      if (signal.aborted && signal.reason === ABORT_REASON_STOP) {
        return
      }

      console.warn('[QRCodeAuth] start failed', err)
      onEvent({
        kind: 'Error',
        message: this.getMessageByError(err)
      })
    }
  }

  stop(unexpected = false) {
    clearTimeout(this.timeoutId)
    this.abortController?.abort(unexpected ? ABORT_REASON_HUNG : ABORT_REASON_STOP)
    this.anonymToken = undefined
    this.authHash = undefined
    this.verificationRequested = false
  }

  async validateCode(code: string): Promise<AuthValidateAuthCodeResponse['status']> {
    const signal = this.abortController?.signal
    signal?.throwIfAborted()

    if (!this.anonymToken || !this.authHash) {
      throw new Error('QR authorization is not active')
    }

    const result = await this.auth.validateAuthCode(this.anonymToken, this.authHash, code, signal)
    return result.status
  }

  private async checkStatusLoop(
    anonymToken: string,
    authHash: string,
    onEvent: (event: IQrCodeAuth.Event) => void,
    signal: AbortSignal
  ) {
    try {
      const response = await this.auth.checkAuthCode(
        anonymToken,
        authHash,
        signal
      )
      signal.throwIfAborted()

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

        case 5: // Verification requested
          if (!this.verificationRequested) {
            this.verificationRequested = true
            onEvent({ kind: 'VerificationRequested' })
          }
          break
      }

      this.timeoutId = window.setTimeout(() => {
        this.checkStatusLoop(anonymToken, authHash, onEvent, signal)
      }, 5000)
    } catch (err) {
      if (signal.aborted && signal.reason === ABORT_REASON_STOP) {
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
