import { API_VERSION } from 'env/Api'
import * as IApi from 'env/IApi'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'
import { getPlatform, toUrlParams } from 'misc/utils'
import { appVersion } from 'misc/constants'

type OauthSuccessResponse = {
  silent_token: string
  silent_token_uuid: string
  /** На момент написания было 600 = 10 минут */
  silent_token_ttl: number
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
  validation_type: '2fa_sms' | '2fa_app' | '2fa_callreset'
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
type OauthFloodControlResponse = {
  // Не спрашивайте...
  error: '9;Flood control'
  error_type?: 'password_bruteforce_attempt'
  error_description?: string
}

type OauthTokenResponse =
  | OauthSuccessResponse
  | OauthInvalidCredentialsResponse
  | OauthRequireTwoFactorResponse
  | OauthInvalidTwoFactorCodeResponse
  | OauthCaptchaResponse
  | OauthUserBannedResponse
  | OauthFloodControlResponse

type GetMessengerTokenResult =
  | { kind: 'Success', silentToken: string, uuid: string, trustedHash?: string }
  | { kind: 'InvalidCredentials', errorMessage: string }
  | {
      kind: 'RequireTwoFactor'
      phoneMask: string
      validationType: '2fa_sms' | '2fa_app' | '2fa_callreset'
      validationSid: string
      needValidateSendSms: boolean
    }
  | { kind: 'InvalidTwoFactorCode', errorMessage: string }
  | { kind: 'Captcha', captchaImg: string, captchaSid: string }
  | { kind: 'UserBanned', banMessage: string, messengerToken: string }
  | { kind: 'FloodControl', errorMessage: string }
  | { kind: 'NetworkError' }
  | { kind: 'UnknownError', payload: unknown }

export type GetMessengerTokenPayload = {
  code?: string
  captcha_sid?: string
  captcha_key?: string
}

// VK Messenger Desktop
export const MESSENGER_APP_ID = 51453752
export const MESSENGER_APP_SECRET = '4UyuCUsdK8pVCNoeQuGi'
export const MESSENGER_APP_SCOPE = 'all'

export async function getMessengerSilentToken(
  login: string,
  password: string,
  payload: GetMessengerTokenPayload = {}
): Promise<GetMessengerTokenResult> {
  const { lang } = useSettingsStore()
  const viewer = useViewerStore()

  const query = toUrlParams({
    client_id: MESSENGER_APP_ID,
    client_secret: MESSENGER_APP_SECRET,
    scope: MESSENGER_APP_SCOPE,
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
              messengerToken: result.ban_info.access_token
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

        case '9;Flood control': {
          return {
            kind: 'FloodControl',
            errorMessage: result.error_description ?? result.error_type ?? result.error
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
      silentToken: result.silent_token,
      uuid: result.silent_token_uuid,
      trustedHash: result.trusted_hash
    }
  } catch (err) {
    console.warn('[Auth.getMessengerToken]', err)

    return {
      kind: 'NetworkError'
    }
  }
}

export async function getMessengerAnonymToken(api: IApi.Api) {
  const { token } = await api.fetch('auth.getAnonymToken', {
    client_id: MESSENGER_APP_ID,
    client_secret: MESSENGER_APP_SECRET
  })

  return token
}

export async function exchangeSilentToken(
  api: IApi.Api,
  anonymToken: string,
  silentToken: string,
  uuid: string
) {
  const {
    access_token: accessToken,
    is_partial: isPartial,
    is_service: isService,
    additional_signup_required: isSignupRequired
  } = await api.fetch('auth.exchangeSilentAuthToken', {
    access_token: anonymToken,
    token: silentToken,
    uuid
  })

  return {
    accessToken,
    isPartial,
    isService,
    isSignupRequired
  }
}

export async function getExchangeToken(api: IApi.Api, accessToken: string, userId: number) {
  const response = await api.fetch('auth.getExchangeToken', {
    access_token: accessToken
  })

  return response.users_exchange_tokens
    .find((item) => item.user_id === userId)
    ?.common_token
}

export async function getAppToken(messengerToken: string, api: IApi.Api): Promise<string | null> {
  const APP_ID = 6717234
  const APP_SCOPE = 136297695

  const fetchedOauth = await fetch('https://oauth.vk.com/authorize?' + toUrlParams({
    client_id: APP_ID,
    display: 'mobile',
    redirect_uri: 'https://oauth.vk.com/blank.html',
    scope: APP_SCOPE,
    response_type: 'token',
    revoke: 1,
    v: API_VERSION
  }))

  const oauthHash = new URL(fetchedOauth.url).searchParams.get('return_auth_hash')
  if (!oauthHash) {
    console.warn('[Auth.getAppToken] no hash', fetchedOauth.url)
    return null
  }

  const oauthResponse = await fetchedOauth.text()
  const anonymToken = oauthResponse.match(/"anonymous_token":"([^"]+)"/)?.[1]
  if (!anonymToken) {
    console.warn('[Auth.getAppToken] no anonym token', { oauthResponse })
    return null
  }

  const { authCode, authHash } = await getAuthCode(api, anonymToken, APP_ID, 0)

  await api.fetch('auth.processAuthCode', {
    access_token: messengerToken,
    auth_code: authCode,
    action: 0
  })
  await api.fetch('auth.processAuthCode', {
    access_token: messengerToken,
    auth_code: authCode,
    action: 1
  })

  const checkResult = await api.fetch('auth.checkAuthCode', {
    anonymous_token: anonymToken,
    auth_hash: authHash,
    web_auth: 1
  })

  if (!('super_app_token' in checkResult)) {
    console.warn('[Auth.getAppToken] check failed', checkResult)
    return null
  }

  if (checkResult.is_partial) {
    console.warn('[Auth.getAppToken] partial token', checkResult)
    return null
  }

  // Этот запрос нужен для получения кук
  await fetch('https://login.vk.com?' + toUrlParams({
    act: 'connect_code_auth',
    token: checkResult.super_app_token,
    app_id: APP_ID,
    oauth_scope: APP_SCOPE,
    oauth_force_hash: 1,
    is_registration: 0,
    oauth_response_type: 'token',
    is_oauth_migrated_flow: 1,
    version: 1,
    to: btoa('https://oauth.vk.com/blank.html')
  }), {
    headers: {
      'X-Origin': 'https://id.vk.com'
    }
  })

  type AuthResponse = {
    data: {
      access_token: string
      auth_user_hash: string
    }
  }

  const connectResponse = await fetch('https://login.vk.com?' + toUrlParams({
    act: 'connect_internal',
    app_id: APP_ID,
    oauth_version: 1,
    version: 1
  }), {
    headers: {
      'X-Origin': 'https://id.vk.com'
    }
  }).then<AuthResponse>((res) => res.json())

  const { access_token: appToken } = await api.fetch('auth.getOauthToken', {
    access_token: connectResponse.data.access_token,
    app_id: APP_ID,
    client_id: APP_ID,
    scope: APP_SCOPE,
    hash: oauthHash,
    auth_user_hash: connectResponse.data.auth_user_hash,
    is_seamless_auth: 0
  })

  return appToken
}

export async function getAuthCode(
  api: IApi.Api,
  anonymToken: string,
  appId: number,
  scope: number | string
) {
  const platform = await getPlatform()

  const {
    auth_url: authUrl,
    auth_code: authCode,
    auth_hash: authHash
  } = await api.fetch('auth.getAuthCode', {
    client_id: appId,
    scope,
    anonymous_token: anonymToken,
    device_name: `VK Desktop ${appVersion} at ${platform}`
  }, {
    // messengerToken: true,
    headers: {
      'X-Origin': 'https://vk.com'
    }
  })

  return { authUrl, authCode, authHash }
}
