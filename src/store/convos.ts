import { defineStore } from 'pinia'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'

export type TypingUser = {
  peerId: Peer.Id
  type: 'text' | 'voice' | 'photo' | 'video' | 'file' | 'videomessage'
  cancelTypingTimeoutId: number
}

export type ScrollAnchor =
  | { kind: 'Message', cmid: Message.Cmid, highlight?: boolean }
  | { kind: 'Unread', cmid: Message.Cmid }
  | { kind: 'None' }

type Convos = {
  convos: Map<Peer.Id, Convo.Convo>
  convoList: {
    peerIds: Peer.Id[]
    hasMore: boolean
    loading: boolean
    loadError: boolean
  }
  lists: Lists.Lists
  connection: {
    status: 'init' | 'initFailed' | 'connected' | 'syncing'
  }
  loadConvoHistoryLock: Map<`${Peer.Id}-${'around' | 'up' | 'down'}`, 'loading' | 'error'>
  sendMessageLock: Set<Peer.Id>
  savedScrollPositions: Map<Peer.Id, number>
  scrollAnchors: Map<Peer.Id, ScrollAnchor>
  typings: Map<Peer.Id, TypingUser[]>
}

export const useConvosStore = defineStore('convos', {
  state: (): Convos => ({
    convos: new Map(),
    convoList: {
      peerIds: [],
      hasMore: true,
      loading: true,
      loadError: false
    },
    lists: Lists.defaults(),
    connection: {
      status: 'init'
    },
    loadConvoHistoryLock: new Map(),
    sendMessageLock: new Set(),
    savedScrollPositions: new Map(),
    scrollAnchors: new Map(),
    typings: new Map()
  }),

  actions: {
    stopTyping(convoId: Peer.Id, typingPeerId: Peer.Id) {
      const typingPeers = this.typings.get(convoId)
      if (!typingPeers) {
        return
      }

      const typingPeer = typingPeers.find(({ peerId }) => typingPeerId === peerId)
      if (!typingPeer) {
        return
      }

      window.clearTimeout(typingPeer.cancelTypingTimeoutId)
      typingPeers.splice(typingPeers.indexOf(typingPeer), 1)
    }
  }
})

// defineStore оборачивает стейт в UnwrapRef, заставляя IDE показывать полный бред.
// Добавляем стейт в исключение, считая, что его значение не является рефом
declare module '@vue/reactivity' {
  interface RefUnwrapBailTypes {
    Convos: Convos
  }
}
