import { defineStore } from 'pinia'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { getMapValueOrCompute } from 'misc/utils'

export type ViewportPosition = {
  /** Cmid of the topmost visible message in the viewport */
  cmid: Message.Cmid
  /** Offset from the viewport beginning, can be negative (i.e. the message was partly invisible) */
  offset: number
}

export type NavigationRequest =
  | {
      kind: 'Message'
      cmid: Message.Cmid
      /** True by default */
      highlight?: boolean
      /** A position to return back in case the message is unavailable */
      returnBack?: boolean | ViewportPosition
    }
  | { kind: 'Unread', cmid: Message.Cmid }
  | { kind: 'FirstMessage' }

export type LoadConvoHistoryLock = {
  status: 'loading' | 'error'
  startCmid: Message.Cmid
  controller: AbortController
}

export type ConvoSession = {
  anchorCmid: Message.Cmid | 0
  viewportPosition?: ViewportPosition
  navigationRequest?: NavigationRequest
  hiddenPinnedCmid?: Message.Cmid
  loadLocks: Partial<Record<'around' | 'up' | 'down', LoadConvoHistoryLock>>
}

export type TypingUser = {
  peerId: Peer.Id
  type: 'text' | 'voice' | 'photo' | 'video' | 'file' | 'videomessage'
  cancelTypingTimeoutId: number
}

type Convos = {
  convos: Map<Peer.Id, Convo.Convo>
  lists: Lists.Lists
  connection: {
    status: 'init' | 'initFailed' | 'connected' | 'syncing'
  }
  convoSessions: Map<Peer.Id, ConvoSession>
  /** These listeners are called synchronously after updating the state, before rendering begins */
  historyLoadCompleteListeners: Map<Peer.Id, Set<() => void>>
  sendMessageLock: Set<Peer.Id>
  typings: Map<Peer.Id, TypingUser[]>
}

export const useConvosStore = defineStore('convos', {
  state: (): Convos => ({
    convos: new Map(),
    lists: Lists.defaults(),
    connection: {
      status: 'init'
    },
    convoSessions: new Map(),
    historyLoadCompleteListeners: new Map(),
    sendMessageLock: new Set(),
    typings: new Map()
  }),

  actions: {
    getDefaultSession(peerId: Peer.Id, initialAnchor: Message.Cmid | 0): ConvoSession {
      return getMapValueOrCompute(this.convoSessions, peerId, () => ({
        anchorCmid: initialAnchor,
        loadLocks: {}
      }))
    },

    requestNavigation(peerId: Peer.Id, request: NavigationRequest) {
      this.getDefaultSession(peerId, request.kind === 'FirstMessage' ? 0 : request.cmid)
        .navigationRequest = request
    },

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
