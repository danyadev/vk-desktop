import { API_VERSION } from 'env/Api'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'
import * as IApi from 'model/IApi'
import { toUrlParams } from 'misc/utils'

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
  /**
   * wrong_otp - неверный код 2фа
   * остальные типы - показываем переданную ошибку
   */
  error_type: 'wrong_otp' | 'restore_wait_delayed_request' | 'cancel_by_owner_needed'
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
  | { kind: 'Success', userId: number, androidToken: string, trustedHash?: string }
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
  | { kind: 'UserBanned', banMessage: string, androidToken: string }
  | { kind: 'NetworkError' }
  | { kind: 'UnknownError', payload: unknown }

export type GetAndroidTokenPayload = {
  code?: string
  captcha_sid?: string
  captcha_key?: string
}

export async function getAndroidToken(
  login: string,
  password: string,
  payload: GetAndroidTokenPayload = {}
): Promise<GetAndroidTokenResult> {
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
    const result = await fetch(`https://oauth.vk.com/token?${query}`)
      .then<OauthTokenResponse>((response) => response.json())

    if ('error' in result) {
      switch (result.error) {
        case 'invalid_client': {
          return {
            kind: 'InvalidCredentials',
            errorMessage: result.error_description || result.error_type
          }
        }

        case 'need_validation': {
          if ('ban_info' in result) {
            return {
              kind: 'UserBanned',
              banMessage: result.ban_info.message,
              androidToken: result.ban_info.access_token
            }
          }

          return {
            kind: 'RequireTwoFactor',
            phoneMask: result.phone_mask,
            validationType: result.validation_type,
            validationSid: result.validation_sid,
            needValidateSendSms: result.validation_resend === 'sms'
          }
        }

        case 'invalid_request': {
          if (result.error_type === 'wrong_otp') {
            return {
              kind: 'InvalidTwoFactorCode',
              errorMessage: result.error_description
            }
          }

          return {
            kind: 'InvalidCredentials',
            errorMessage: result.error_description || result.error_type
          }
        }

        case 'need_captcha': {
          return {
            kind: 'Captcha',
            captchaImg: result.captcha_img,
            captchaSid: result.captcha_sid
          }
        }
      }

      return {
        kind: 'UnknownError',
        payload: result
      }
    }

    return {
      kind: 'Success',
      userId: result.user_id,
      androidToken: result.access_token,
      trustedHash: result.trusted_hash
    }
  } catch (err) {
    console.warn(err)

    return {
      kind: 'NetworkError'
    }
  }
}

export async function getAppToken(androidToken: string, api: IApi.Api): Promise<string | null> {
  const APP_ID = 6717234
  const APP_SCOPE = 136297695

  const query = toUrlParams({
    redirect_uri: 'https://oauth.vk.com/blank.html',
    display: 'page',
    response_type: 'token',
    access_token: androidToken,
    revoke: 1,
    scope: APP_SCOPE,
    client_id: APP_ID,
    v: API_VERSION,
    sdk_package: 'ru.danyadev.vkdesktop',
    sdk_fingerprint: '9E76F3AF885CD6A1E2378197D4E7DF1B2C17E46C'
  })

  /**
   * 1. Получаем страницу для авторизации приложения
   *
   * Есть две версии этой страницы:
   * 1) старая, с кнопкой для подтверждения, которая редиректит на фактическую авторизацию
   * 2) новая, через vk id и на реакте, но на странице зашит жсон с инфой для получения токена
   */
  const authorizeBody = await fetch(`https://oauth.vk.com/authorize?${query}`)
    .then((response) => response.text())
    .catch(() => '')

  // 2.1. Пытаемся достать ссылку для подтверждения
  const authLink = authorizeBody.match(/"(https:\/\/[a-z.]+\/auth_by_token.+?)"/i)?.[1]

  if (!authLink) {
    // 2.2. Если ссылки не оказалось, считаем, что это новая версия через vk id
    const returnHash = authorizeBody.match(/"return_auth":"([^"]+)"/)?.[1]

    if (!returnHash) {
      return null
    }

    const authResult = await api.fetch('auth.getOauthToken', {
      access_token: androidToken,
      app_id: APP_ID,
      scope: APP_SCOPE,
      hash: returnHash
    }).catch(() => null)

    if (!authResult) {
      return null
    }

    return authResult.access_token
  }

  // 3. Переходим по ссылке для фактической авторизации
  const pageWithToken = await fetch(`https://oauth.vk.com/${authLink}`).catch(() => null)

  if (!pageWithToken) {
    return null
  }

  // 4. Получаем токен из хеш-параметра ссылки на страницу
  const urlMaybeWithToken = pageWithToken.headers.get('x-original-url-by-electron') || ''
  const hashIndex = urlMaybeWithToken.indexOf('#')

  if (hashIndex !== -1) {
    const hashValue = urlMaybeWithToken.slice(hashIndex + 1)
    return new URLSearchParams(hashValue).get('access_token')
  }

  return null
}
