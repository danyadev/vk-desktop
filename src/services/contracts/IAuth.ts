export type OauthSuccessResponse = {
  silent_token: string
  silent_token_uuid: string
  /** На момент написания было 600 = 10 минут */
  silent_token_ttl: number
  /** Приходит при наличии 2fa */
  trusted_hash?: string
}
export type OauthInvalidCredentialsResponse = {
  error: 'invalid_client'
  error_type: 'username_or_password_is_incorrect'
  /** 'Неправильный логин или пароль' */
  error_description: string
}
export type OauthRequireTwoFactorResponse = {
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
export type OauthInvalidTwoFactorCodeResponse = {
  error: 'invalid_request'
  /**
   * wrong_otp - неверный код 2фа
   * остальные типы - показываем переданную ошибку
   */
  error_type: 'wrong_otp' | 'restore_wait_delayed_request' | 'cancel_by_owner_needed'
  error_description: string
}
export type OauthCaptchaResponse = {
  error: 'need_captcha'
  captcha_img: string
  captcha_sid: string
}
export type OauthUserBannedResponse = {
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
export type OauthFloodControlResponse = {
  // Не спрашивайте...
  error: '9;Flood control'
  error_type?: 'password_bruteforce_attempt'
  error_description?: string
}

export type OauthTokenResponse =
  | OauthSuccessResponse
  | OauthInvalidCredentialsResponse
  | OauthRequireTwoFactorResponse
  | OauthInvalidTwoFactorCodeResponse
  | OauthCaptchaResponse
  | OauthUserBannedResponse
  | OauthFloodControlResponse

export type GetMessengerTokenResult =
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

export type ExchangeSilentTokenResult = {
  accessToken: string
  isPartial: boolean
  isService: boolean
  isSignupRequired: boolean
}

export type GetAuthCodeResult = {
  authUrl: string
  authCode: string
  authHash: string
}
