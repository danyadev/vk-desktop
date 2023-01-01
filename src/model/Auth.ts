import { API_VERSION } from 'env/Api'
import { toUrlParams } from 'misc/utils'
import { androidUserAgent } from 'misc/constants'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'

type OauthSuccessResponse = {
  user_id: number
  expires_in: number
  access_token: string
  /** Приходит при наличии 2fa */
  trusted_hash?: string
}
type OauthInvalidCredentialsResponse = {
  error: 'invalid_client'
  error_type: 'username_or_password_is_incorrect'
  /** 'Неправильный логин или пароль' */
  error_description: string
}
type OauthRequireTwoFactorResponse = {
  error: 'need_validation'
  /** 'sms sent, use code param' */
  error_description: string
  phone_mask: string
  redirect_uri: string
  validation_type: '2fa_sms' | '2fa_app'
  validation_sid: string
  /** Приходит, если для отправки кода нужно вызвать метод auth.validatePhone */
  validation_resend?: 'sms'
}
type OauthInvalidTwoFactorCodeResponse = {
  error: 'invalid_request'
  error_type: 'wrong_otp'
  /** 'Вы ввели неверный код' */
  error_description: string
}
type OauthCaptchaResponse = {
  error: 'need_captcha'
  captcha_img: string
  captcha_sid: string
}
type OauthUserBannedResponse = {
  error: 'need_validation'
  error_description: 'user has been banned'
  ban_info: {
    /** Имя пользователя */
    member_name: string
    /** 'Ваша страница заблокирована' */
    message: string
    access_token: string
  }
}

type OauthTokenResponse =
  | OauthSuccessResponse
  | OauthInvalidCredentialsResponse
  | OauthRequireTwoFactorResponse
  | OauthInvalidTwoFactorCodeResponse
  | OauthCaptchaResponse
  | OauthUserBannedResponse

type GetAndroidTokenResult =
  | { kind: 'Success', userId: number, accessToken: string, trustedHash?: string }
  | { kind: 'InvalidCredentials', errorMessage: string }
  | {
      kind: 'RequireTwoFactor'
      phoneMask: string
      validationType: '2fa_sms' | '2fa_app'
      validationSid: string
      needValidateSendSms: boolean
    }
  | { kind: 'InvalidTwoFactorCode', errorMessage: string }
  | { kind: 'Captcha', captchaImg: string, captchaSid: string }
  | { kind: 'UserBanned', accessToken: string }
  | { kind: 'UnknownError', payload: unknown }

type GetAndroidTokenPayload = {
  code?: number
  captcha_sid?: string
  captcha_key?: string
}

export function getAndroidToken(
  login: string,
  password: string,
  payload: GetAndroidTokenPayload = {}
) {
  return new Promise<GetAndroidTokenResult>(async (resolve) => {
    const { lang } = useSettingsStore()
    const viewer = useViewerStore()

    const query = toUrlParams({
      scope: 'all',
      client_id: 2274003,
      client_secret: 'hHbZxrka2uZ6jB1inYsH',
      username: login,
      password,
      '2fa_supported': 1,
      grant_type: 'password',
      lang,
      v: API_VERSION,
      trusted_hash: viewer.trustedHashes[login],
      ...payload
    })

    try {
      const result = await fetch(`https://oauth.vk.com/token?${query}`, {
        headers: {
          'User-Agent': androidUserAgent
        }
      }).then<OauthTokenResponse>((response) => response.json())

      if ('error' in result) {
        switch (result.error) {
          case 'invalid_client': {
            return resolve({
              kind: 'InvalidCredentials',
              errorMessage: result.error_description || result.error_type
            })
          }

          case 'need_validation': {
            if ('ban_info' in result) {
              return resolve({
                kind: 'UserBanned',
                accessToken: result.ban_info.access_token
              })
            }

            return resolve({
              kind: 'RequireTwoFactor',
              phoneMask: result.phone_mask,
              validationType: result.validation_type,
              validationSid: result.validation_sid,
              needValidateSendSms: result.validation_resend === 'sms'
            })
          }

          case 'invalid_request': {
            return resolve({
              kind: 'InvalidTwoFactorCode',
              errorMessage: result.error_description || result.error_type
            })
          }

          case 'need_captcha': {
            return resolve({
              kind: 'Captcha',
              captchaImg: result.captcha_img,
              captchaSid: result.captcha_sid
            })
          }

          default: {
            const _typeguard: never = result
          }
        }

        return resolve({
          kind: 'UnknownError',
          payload: result
        })
      }

      resolve({
        kind: 'Success',
        userId: result.user_id,
        accessToken: result.access_token,
        trustedHash: result.trusted_hash
      })
    } catch (err) {
      console.error(err)
      resolve({
        kind: 'UnknownError',
        payload: 'FetchError'
      })
    }
  })
}
