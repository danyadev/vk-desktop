/* eslint-disable @typescript-eslint/ban-types */

// auth.validatePhone
export type AuthValidatePhoneParams = {
  sid: string
}

export type AuthValidatePhoneResponse = {
  type: 'general'
  sid: string
  /** Время до появления возможности перезапроса в секундах */
  delay: number
  validation_type: 'sms'
  validation_resend: 'sms'
  libverify_support: false
}

// auth.getOauthToken
export type AuthGetOauthTokenParams = {
  app_id: number
  client_id: number
  scope: number
  hash: string
  auth_user_hash: string
  is_seamless_auth: 0
}

export type AuthGetOauthTokenResponse = {
  access_token: string
  expires_in: number
  user_id: number
}

// auth.getAnonymToken
export type AuthGetAnonymTokenParams = {
  client_id: number
  client_secret: string
}

export type AuthGetAnonymTokenResponse = {
  token: string
}

// auth.getAuthCode
export type AuthGetAuthCodeParams = {
  client_id: number
  scope: string | number
  anonymous_token: string
  device_name: string
}

export type AuthGetAuthCodeResponse = {
  auth_code: string
  auth_hash: string
  auth_id: string
  auth_url: string
  expires_in: number
}

// auth.checkAuthCode
export type AuthCheckAuthCodeParams = {
  anonymous_token: string
  auth_hash: string
  web_auth?: 0 | 1
}

export type AuthCheckAuthCodeResponse =
  /** Created */
  | { status: 0, expires_in: number }
  /** Opened */
  | { status: 1, expires_in: number }
  /** Approved */
  | { status: 2, access_token: string, is_partial: boolean, provider_app_id: number }
  | { status: 2, super_app_token: string, is_partial: boolean, provider_app_id: number }
  /** Declined */
  | { status: 3 }
  /** Expired */
  | { status: 4 }

// auth.validateAccount
export type AuthValidateAccountParams = {
  login: string
  supported_ways: string
  client_id: number
  client_secret: string
}

export type AuthValidateAccountResponse = {
  flow_name: string
  flow_names: Array<'password' | 'passkey'>
  sid: string
}

// auth.processAuthCode
export type AuthProcessAuthCodeParams = {
  auth_code: string
  /**
   * 0 - инициализация авторизации
   * 1 - подтверждение авторизации
   */
  action: 0 | 1
}

export type AuthProcessAuthCodeResponse =
  // Не описывал весь ответ, так как он не используется
  | { auth_info: { auth_id: string } }
  | { status: 1 }

// auth.exchangeSilentAuthToken
export type AuthExchangeSilentAuthTokenParams = {
  token: string
  uuid: string
}

export type AuthExchangeSilentAuthTokenResponse = {
  access_token: string
  access_token_id: string
  additional_signup_required: boolean
  expires_in: number
  is_partial: boolean
  is_service: boolean
  source: number
  source_description: string
  user_id: number
}

// auth.getExchangeToken
export type AuthGetExchangeTokenParams = {}

export type AuthGetExchangeTokenResponse = {
  users_exchange_tokens: Array<{
    user_id: number
    profile_type: 0 | 2
    common_token: string
  }>
}
