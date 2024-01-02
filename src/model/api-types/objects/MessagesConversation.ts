import { MessagesKeyboard } from 'model/api-types/objects/MessagesKeyboard'
import { MessagesPinnedMessage } from 'model/api-types/objects/MessagesPinnedMessage'

export type MessagesConversation = {
  peer: {
    id: number
    local_id?: number
    type: 'user' | 'group' | 'chat' | 'email'
  }
  sort_id?: {
    major_id: number
    minor_id: number
  }
  last_message_id: number
  last_conversation_message_id?: number
  in_read: number
  out_read: number
  in_read_cmid?: number
  out_read_cmid?: number
  unread_count?: number
  is_marked_unread?: boolean
  out_read_by?: {
    count?: number
    member_ids?: number[]
  }
  important?: boolean
  unanswered?: boolean
  special_service_type?: 'business_notify'
  message_request_data?: {
    status?: string
    inviter_id?: number
    request_date?: number
  }
  mentions?: number[]
  mention_cmids?: number[]
  expire_messages?: number[]
  expire_cmids?: number[]
  current_keyboard?: MessagesKeyboard
  push_settings?: {
    disabled_forever: boolean
    disabled_until?: number
    no_sound: boolean
    disabled_mentions?: boolean
    disabled_mass_mentions?: boolean
  }
  can_write?: {
    allowed: boolean
    reason?: number
  }
  can_send_money?: boolean
  can_receive_money?: boolean
  chat_settings?: {
    members_count?: number
    friends_count?: number
    owner_id: number
    title: string
    description?: string
    pinned_message?: MessagesPinnedMessage
    state: 'in' | 'kicked' | 'left' | 'out'
    photo?: {
      photo_50?: string
      photo_100?: string
      photo_200?: string
      photo_base?: string
      is_default_photo?: boolean
      is_default_call_photo?: boolean
    }
    admin_ids?: number[]
    is_group_channel?: boolean
    acl: {
      /** Can you change photo, description and name */
      can_change_info: boolean
      can_change_invite_link: boolean
      can_change_pin: boolean
      can_invite: boolean
      /** Can you promote simple users to chat admins */
      can_promote_users: boolean
      can_see_invite_link: boolean
      /** Can you moderate (delete) other users' messages */
      can_moderate: boolean
      can_copy_chat: boolean
      can_call: boolean
      can_use_mass_mentions: boolean
      can_change_service_type?: boolean
      can_change_style?: boolean
      can_send_reactions?: boolean
    }
    permissions?: {
      invite?: 'owner' | 'owner_and_admins' | 'all'
      change_info?: 'owner' | 'owner_and_admins' | 'all'
      change_pin?: 'owner' | 'owner_and_admins' | 'all'
      use_mass_mentions?: 'owner' | 'owner_and_admins' | 'all'
      see_invite_link?: 'owner' | 'owner_and_admins' | 'all'
      call?: 'owner' | 'owner_and_admins' | 'all'
      change_admins?: 'owner' | 'owner_and_admins'
      change_style?: 'owner' | 'owner_and_admins' | 'all'
    }
    is_disappearing?: boolean
    theme?: string
    disappearing_chat_link?: string
    is_service?: boolean
    is_donut?: boolean
    donut_owner_id?: number
    short_poll_reactions?: boolean
  }
  call_in_progress?: {
    call_id: string
    participants: {
      count?: number
      list?: number[]
    }
    // ...и некоторые другие поля
  }
  is_new?: boolean
  is_archived?: boolean
  style?: string
  folder_ids?: number[]
  unread_reactions?: number[]
  peer_flags?: number
}
