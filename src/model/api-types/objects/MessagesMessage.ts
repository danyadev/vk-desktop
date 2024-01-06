import { MessagesKeyboard } from 'model/api-types/objects/MessagesKeyboard'

export type MessagesMessage = {
  version: number
  action?: MessagesMessageAction
  attachments?: Array<{ type: string }> // TODO
  template?: unknown // TODO
  conversation_message_id?: number
  date: number
  deleted?: 0 | 1
  from_id: number
  fwd_messages?: unknown[] // TODO
  geo?: unknown // TODO
  id: number
  important?: boolean
  is_hidden?: boolean
  keyboard?: MessagesKeyboard
  members_count?: number
  message_tag?: string
  out: 0 | 1
  payload?: string
  peer_id: number
  random_id?: number
  ref?: string
  ref_source?: string
  reply_message?: unknown // TODO
  reaction_id?: number
  reactions?: unknown[] // TODO
  last_reaction_id?: number
  is_pinned?: boolean
  text: string
  update_time?: number
  /** Time until message will be converted to stub */
  expire_ttl?: number
  /** Time until message will be deleted */
  ttl?: number
  is_expired?: boolean
  was_listened?: boolean
  was_played?: boolean
  pinned_at?: number
  is_silent?: boolean
  is_mentioned_user: boolean
  is_unavailable?: boolean
  admin_author_id?: number
}

export type MessagesMessageAction = {
  type:
    | 'chat_create'
    | 'chat_title_update'
    | 'chat_photo_update'
    | 'chat_photo_remove'
    | 'chat_invite_user'
    | 'chat_kick_user'
    | 'chat_pin_message'
    | 'chat_unpin_message'
    | 'chat_kick_don'
    | 'conversation_style_update'
    | 'conversation_style_update_action'
    | 'call_transcription_failed'
    | 'custom'
    | 'chat_invite_user_by_link'
    | 'chat_invite_user_by_message_request'
    | 'chat_screenshot'
    | 'chat_group_call_started'
    | 'accepted_message_request'
    | 'chat_invite_user_by_call'
    | 'chat_invite_user_by_call_join_link'
    | 'chat_kick_user_call_block'
  conversation_message_id?: number
  member_id?: number
  /** Message body of related message */
  message?: string
  photo?: {
    photo_50: string
    photo_100: string
    photo_200: string
    photo_base: string
  }
  style?: string
  /** New chat title for chat_create and chat_title_update actions */
  text?: string
  /** Previous chat title for chat_title_update action */
  old_text?: string
}
