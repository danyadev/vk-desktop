import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { NonEmptyArray, Opaque } from 'misc/utils'

export type Cmid = Opaque<number, Message>

export type Message = Confirmed | Pending
export type Confirmed = Normal | Service | Expired

export interface BaseMessage {
  peerId: Peer.Id
  cmid: Cmid
  authorId: Peer.OwnerId
  isOut: boolean
  sentAt: number
  updatedAt: number | undefined
  randomId: number
}

export interface Normal extends BaseMessage {
  kind: 'Normal'
  text: string
  attaches: Attach.Attaches
  replyMessage: Foreign | undefined
  forwardedMessages: NonEmptyArray<Foreign> | undefined
}

export interface Service extends BaseMessage {
  kind: 'Service'
  action: ServiceAction
}

export interface Expired extends BaseMessage {
  kind: 'Expired'
}

export interface Foreign extends Omit<Normal, 'kind' | 'peerId' | 'cmid' | 'randomId'> {
  kind: 'Foreign'
  peerId: Peer.Id | undefined
  cmid: Cmid | undefined
  rootCmid: Cmid
  rootPeerId: Peer.Id
  isUnavailable: boolean
}

export interface Pinned extends Omit<Normal, 'kind' | 'updatedAt' | 'randomId'> {
  kind: 'Pinned'
  isUnavailable: boolean
}

export interface Pending extends Omit<Normal, 'kind' | 'cmid' | 'isOut'> {
  kind: 'Pending'
  /** Проставляется после ответа messages.send, если движок не успел отдать сообщение быстрее */
  cmid: Cmid | undefined
  isOut: true
  isFailed: boolean
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
      photo: Attach.Photo | undefined
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
      peerId: Peer.OwnerId
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

export function resolveCmid(cmid: number): Cmid {
  if (cmid <= 0) {
    throw new Error('Message.Cmid = ' + cmid)
  }

  return cmid as Cmid
}

export function isUnread(message: Message, convo: Convo.Convo): boolean {
  if (message.kind === 'Pending') {
    return true
  }

  return message.isOut
    ? message.cmid > convo.outReadBy
    : message.cmid > convo.inReadBy
}
