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
