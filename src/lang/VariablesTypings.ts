export type VariablesTypings<T = string | number> = {
  auth_sms_with_code_sent: { phone: T }
  auth_resend_sms_at: { time: T }

  me_convo_list_author: { author: T }
  me_convo_list_date_mins: { mins: T }
  me_convo_list_date_hours: { hours: T }
  me_convo_list_date_days: { days: T }
  me_convo_list_date_weeks: { weeks: T }

  me_service_chat_create: { author: T, title: T }
  me_service_chat_title_update: { author: T, oldTitle: T, title: T }
  me_service_chat_photo_update: { author: T }
  me_service_chat_photo_remove: { author: T }
  me_service_chat_invite_user_by_link: { author: T }
  me_service_chat_screenshot: { author: T }
  me_service_chat_group_call_started: { author: T }
  me_service_chat_invite_user_by_call_join_link: { author: T }
  me_service_chat_invite_user: { author: T, target: T }
  me_service_chat_kick_user: { author: T, target: T }
  me_service_chat_invite_user_self: { author: T }
  me_service_chat_kick_user_self: { author: T }
  me_service_accepted_message_request: { target: T }
  me_service_chat_invite_user_by_message_request: { author: T, target: T }
  me_service_chat_invite_user_by_call: { author: T, target: T }
  me_service_chat_kick_user_call_block: { target: T }
  me_service_chat_pin_message: { author: T, message: T }
  me_service_chat_unpin_message: { author: T, message: T }
  me_service_conversation_style_update: { author: T, style: T }
  me_service_conversation_style_reset: { author: T }

  confirmAccountDelete_confirm: { userName: T }
}
