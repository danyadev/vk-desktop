import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { NonEmptyArray, Opaque } from 'misc/utils'

export type Cmid = Opaque<number, Message>

export type Message = Normal | Service | Expired

interface BaseMessage {
  cmid: Cmid
  peerId: Peer.Id
  authorId: Peer.UserId | Peer.GroupId
  isOut: boolean
  sentAt: number
}

export interface Normal extends BaseMessage {
  kind: 'Normal'
  text: string
  attaches: Attach.Attaches
  replyMessage?: Foreign
  forwardedMessages?: NonEmptyArray<Foreign>
  updatedAt?: number
}

export interface Service extends BaseMessage {
  kind: 'Service'
  action: ServiceAction
}

export interface Expired extends BaseMessage {
  kind: 'Expired'
  updatedAt: number
}

export interface Foreign {
  kind: 'Foreign'
  cmid: Cmid
  rootCmid: Cmid
  peerId?: Peer.Id
  rootPeerId: Peer.Id
  authorId: Peer.UserId | Peer.GroupId
  sentAt: number
  text: string
  attaches: Attach.Attaches
  replyMessage?: Foreign
  forwardedMessages?: NonEmptyArray<Foreign>
  updatedAt?: number
}

export type ServiceAction =
  | {
      type: 'chat_create'
      title: string
    }
  | {
      type: 'chat_title_update'
      title: string
      oldTitle: string
    }
  | {
      type: 'chat_photo_update'
      photo?: { photo50: string, photo100: string, photo200: string }
    }
  | {
      type:
        | 'chat_photo_remove'
        | 'chat_kick_don'
        | 'call_transcription_failed'
        | 'chat_invite_user_by_link'
        | 'chat_screenshot'
        | 'chat_group_call_started'
        | 'chat_invite_user_by_call_join_link'
    }
  | {
      type: 'chat_invite_user' | 'chat_kick_user' | 'accepted_message_request'
      peerId: Peer.UserId | Peer.GroupId
    }
  | {
      type:
        | 'chat_invite_user_by_message_request'
        | 'chat_invite_user_by_call'
        | 'chat_kick_user_call_block'
      peerId: Peer.UserId
    }
  | {
      type: 'chat_pin_message' | 'chat_unpin_message'
      cmid: Cmid
      message: string
    }
  | {
      type: 'conversation_style_update' | 'conversation_style_update_action'
      style: Convo.Style | undefined
    }
  | {
      type: 'custom'
      message: string
    }
  | { type: 'unknown' }

export function resolveCmid(cmid: number, allowZero = false): Cmid {
  if (!allowZero && cmid <= 0) {
    throw new Error('Message.Cmid = ' + cmid)
  }

  return cmid as Cmid
}
