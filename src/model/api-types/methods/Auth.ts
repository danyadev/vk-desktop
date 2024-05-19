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
  hash: string
  scope: number
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
}

export type AuthCheckAuthCodeResponse =
  /** Created */
  | { status: 0, expires_in: number }
  /** Opened */
  | { status: 1, expires_in: number }
  /** Approved */
  | { status: 2, access_token: string, is_partial: boolean, provider_app_id: number }
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
