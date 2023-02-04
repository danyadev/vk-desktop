type ExplicitVariablesTypings = {
  auth_sms_with_code_sent: [string]
  auth_resend_sms_at: [string]
}

export type VariablesTypings<Dictionary extends Record<string, unknown>> =
  Record<
    Exclude<keyof Dictionary, keyof ExplicitVariablesTypings>,
    never
  > & {
    [Key in keyof ExplicitVariablesTypings]: [ExplicitVariablesTypings[Key]]
  }
