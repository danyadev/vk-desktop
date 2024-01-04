import * as Peer from 'model/Peer'
import { Opaque } from 'misc/utils'

export type Cmid = Opaque<number, Message>

export type Message = Normal | Service | Expired

type Normal = {
  kind: 'Normal'
  cmid: Cmid
  peerId: Peer.Id
  authorId: Peer.Id
  isOut: boolean
  text: string
  attachments: unknown[] // TODO
  sentAt: number
  updatedAt?: number
}

type Service = {
  kind: 'Service'
  cmid: Cmid
  peerId: Peer.Id
  authorId: Peer.Id
  isOut: boolean
  sentAt: number
}

type Expired = {
  kind: 'Expired'
  cmid: Cmid
  peerId: Peer.Id
  authorId: Peer.Id
  isOut: boolean
  sentAt: number
  updatedAt: number
}

export function resolveCmid(cmid: number): Cmid {
  if (cmid <= 0) {
    throw new Error('Message.Cmid = ' + cmid)
  }

  return cmid as Cmid
}
