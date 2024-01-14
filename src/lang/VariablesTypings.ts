type ExplicitVariablesTypings = {
  auth_sms_with_code_sent: [phone: string]
  auth_resend_sms_at: [time: string]

  me_convo_list_author: { author: string }
  me_convo_list_date_mins: { mins: number }
  me_convo_list_date_hours: { hours: number }
  me_convo_list_date_days: { days: number }
  me_convo_list_date_weeks: { weeks: number }

  me_service_chat_create: { author: string, title: string }
  me_service_chat_title_update: { author: string, oldTitle: string, title: string }
  me_service_chat_photo_update: { author: string }
  me_service_chat_photo_remove: { author: string }
  me_service_chat_invite_user_by_link: { author: string }
  me_service_chat_screenshot: { author: string }
  me_service_chat_group_call_started: { author: string }
  me_service_chat_invite_user_by_call_join_link: { author: string }
  me_service_chat_invite_user: { author: string, target: string }
  me_service_chat_kick_user: { author: string, target: string }
  me_service_chat_invite_user_self: { author: string }
  me_service_chat_kick_user_self: { author: string }
  me_service_accepted_message_request: { target: string }
  me_service_chat_invite_user_by_message_request: { author: string, target: string }
  me_service_chat_invite_user_by_call: { author: string, target: string }
  me_service_chat_kick_user_call_block: { target: string }
  me_service_chat_pin_message: { author: string, message: string }
  me_service_chat_unpin_message: { author: string, message: string }
  me_service_conversation_style_update: { author: string, style: string }
  me_service_conversation_style_reset: { author: string }

  confirmAccountDelete_confirm: [userName: string]
}

export type VariablesTypings<Dictionary extends Record<string, unknown>> =
  Record<
    Exclude<keyof Dictionary, keyof ExplicitVariablesTypings>,
    []
  > & {
    [Key in keyof ExplicitVariablesTypings]: [ExplicitVariablesTypings[Key]]
  }
