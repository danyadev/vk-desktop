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
  unread_count?: number
  is_marked_unread?: boolean
  out_read_by?: {
    count?: number
    member_ids?: number[]
  }
  special_service_type?: 'business_notify'
  message_request_data?: {
    status?: string
    inviter_id?: number
    request_date?: number
  }
  mentions?: number[]
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
  chat_settings?: {
    members_count?: number
    friends_count?: number
    owner_id: number
    title: string
    pinned_message?: MessagesPinnedMessage
    state: 'in' | 'kicked' | 'left'
    photo?: {
      photo_50?: string
      photo_100?: string
      photo_200?: string
      is_default_photo?: boolean
    }
    admin_ids?: number[]
    active_ids: number[]
    is_group_channel?: boolean
    acl: {
      /** Can you change photo, description and name */
      can_change_info: boolean
      can_change_invite_link: boolean
      /** Can you pin/unpin message for this chat */
      can_change_pin: boolean
      /** Can you invite other peers in chat */
      can_invite: boolean
      /** Can you promote simple users to chat admins */
      can_promote_users: boolean
      can_see_invite_link: boolean
      /** Can you moderate (delete) other users' messages */
      can_moderate: boolean
      can_copy_chat: boolean
      /** Can you init group call in the chat */
      can_call: boolean
      can_use_mass_mentions: boolean
      can_change_service_type?: boolean
    }
    permissions?: {
      invite?: 'owner' | 'owner_and_admins' | 'all'
      change_info?: 'owner' | 'owner_and_admins' | 'all'
      change_pin?: 'owner' | 'owner_and_admins' | 'all'
      use_mass_mentions?: 'owner' | 'owner_and_admins' | 'all'
      see_invite_link?: 'owner' | 'owner_and_admins' | 'all'
      call?: 'owner' | 'owner_and_admins' | 'all'
      change_admins?: 'owner' | 'owner_and_admins'
    }
    is_disappearing?: boolean
    theme?: string
    disappearing_chat_link?: string
    is_service?: boolean
  }
}
