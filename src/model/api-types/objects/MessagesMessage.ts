import { MessagesKeyboard } from 'model/api-types/objects/MessagesKeyboard'

export type MessagesMessage = {
  version: number
  action?: unknown // TODO
  attachments?: unknown // TODO
  template?: unknown // TODO
  conversation_message_id?: number
  date: number
  deleted?: 0 | 1
  from_id: number
  fwd_messages?: unknown // TODO
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
