import * as IApi from 'services/contracts/IApi'
import * as IAuth from 'services/contracts/IAuth'
import { getPlatform, toUrlParams } from 'misc/utils'
import { appVersion } from 'misc/constants'

export class Auth {
  // VK Messenger Desktop
  static readonly MESSENGER_APP_ID = 51453752
  static readonly MESSENGER_APP_SECRET = '4UyuCUsdK8pVCNoeQuGi'
  // Самые максимальные доступные скоупы для этого приложения.
  // Узнать актуальное значение можно, если получить токен без скоупов через qr code
  // и вызвать account.getAppPermissions.
  // friends, photos, audio, video, stories, messages, wall, docs, groups, stats
  static readonly MESSENGER_APP_SCOPE = 1454174

  constructor(private api: IApi.Api) {}

  async getMessengerSilentToken(
    login: string,
    password: string,
    lang: string,
    trustedHash: string | undefined,
    payload: IAuth.GetMessengerTokenPayload
  ): Promise<IAuth.GetMessengerTokenResult> {
    const query = toUrlParams({
      client_id: Auth.MESSENGER_APP_ID,
      client_secret: Auth.MESSENGER_APP_SECRET,
      scope: Auth.MESSENGER_APP_SCOPE,
      username: login,
      password,
      '2fa_supported': 1,
      grant_type: 'password',
      lang,
      v: IApi.VERSION,
      trusted_hash: trustedHash,
      ...payload
    })

    try {
      const result = await fetch(`https://oauth.vk.com/token?${query}`)
        .then<IAuth.OauthTokenResponse>((response) => response.json())

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

  async getMessengerAnonymToken(abortSignal?: AbortSignal) {
    const { token } = await this.api.fetch('auth.getAnonymToken', {
      client_id: Auth.MESSENGER_APP_ID,
      client_secret: Auth.MESSENGER_APP_SECRET
    }, { signal: abortSignal })

    return token
  }

  async exchangeSilentToken(
    anonymToken: string,
    silentToken: string,
    uuid: string
  ): Promise<IAuth.ExchangeSilentTokenResult> {
    const {
      access_token: accessToken,
      is_partial: isPartial,
      is_service: isService,
      additional_signup_required: isSignupRequired
    } = await this.api.fetch('auth.exchangeSilentAuthToken', {
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

  async getExchangeToken(accessToken: string, userId: number) {
    const response = await this.api.fetch('auth.getExchangeToken', {
      access_token: accessToken
    })

    return response.users_exchange_tokens
      .find((item) => item.user_id === userId)
      ?.common_token
  }

  async refreshByExchangeToken(exchangeToken: string) {
    const result = await fetch('https://oauth.vk.com/auth_by_exchange_token?' + toUrlParams({
      v: IApi.VERSION,
      client_id: Auth.MESSENGER_APP_ID,
      exchange_token: exchangeToken
    })).then<IAuth.OauthSuccessResponse>((res) => res.json())

    if (!('silent_token' in result)) {
      console.warn('refresh token error', result)
      throw 'refresh token error'
    }

    const anonymToken = await this.getMessengerAnonymToken()
    const {
      accessToken,
      isPartial,
      isService,
      isSignupRequired
    } = await this.exchangeSilentToken(anonymToken, result.silent_token, result.silent_token_uuid)

    if (isPartial || isService || isSignupRequired) {
      console.warn('refreshed token is incorrect', { isPartial, isService, isSignupRequired })
      throw 'refreshed token is incorrect'
    }

    return accessToken
  }

  async getAppToken(messengerToken: string): Promise<string> {
    const APP_ID = 6717234
    const APP_SCOPE = 136297695

    const fetchedOauth = await fetch('https://oauth.vk.com/authorize?' + toUrlParams({
      client_id: APP_ID,
      display: 'mobile',
      redirect_uri: 'https://oauth.vk.com/blank.html',
      scope: APP_SCOPE,
      response_type: 'token',
      revoke: 1,
      v: IApi.VERSION
    }))

    const oauthHash = new URL(fetchedOauth.url).searchParams.get('return_auth_hash')
    if (!oauthHash) {
      console.warn('[Auth.getAppToken] no hash', fetchedOauth.url)
      throw 'no oauth hash'
    }

    const oauthResponse = await fetchedOauth.text()
    const anonymToken = oauthResponse.match(/"anonymous_token":"([^"]+)"/)?.[1]
    if (!anonymToken) {
      console.warn('[Auth.getAppToken] no anonym token', { oauthResponse })
      throw 'no anonym token'
    }

    const { authCode, authHash } = await this.getAuthCode(anonymToken, APP_ID, 0)

    await this.api.fetch('auth.processAuthCode', {
      access_token: messengerToken,
      auth_code: authCode,
      action: 0
    })
    await this.api.fetch('auth.processAuthCode', {
      access_token: messengerToken,
      auth_code: authCode,
      action: 1
    })

    const checkResult = await this.api.fetch('auth.checkAuthCode', {
      anonymous_token: anonymToken,
      auth_hash: authHash,
      web_auth: 1
    })

    if (!('super_app_token' in checkResult)) {
      console.warn('[Auth.getAppToken] check failed', checkResult)
      throw 'no super_app_token'
    }

    if (checkResult.is_partial) {
      console.warn('[Auth.getAppToken] partial token', checkResult)
      throw 'partial token'
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

    const { access_token: appToken } = await this.api.fetch('auth.getOauthToken', {
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

  async getAuthCode(
    anonymToken: string,
    appId: number,
    scope: number | string,
    abortSignal?: AbortSignal
  ): Promise<IAuth.GetAuthCodeResult> {
    const platform = await getPlatform()

    const {
      auth_url: authUrl,
      auth_code: authCode,
      auth_hash: authHash
    } = await this.api.fetch('auth.getAuthCode', {
      client_id: appId,
      scope,
      anonymous_token: anonymToken,
      device_name: `VK Desktop ${appVersion} at ${platform}`
    }, {
      signal: abortSignal,
      headers: {
        'X-Origin': 'https://vk.com'
      }
    })

    return { authUrl, authCode, authHash }
  }

  checkAuthCode(anonymToken: string, authHash: string, abortSignal?: AbortSignal) {
    return this.api.fetch('auth.checkAuthCode', {
      anonymous_token: anonymToken,
      auth_hash: authHash
    }, { signal: abortSignal })
  }
}
