import { watch } from 'vue'
import { defineStore } from 'pinia'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'

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
      /**
       * Whether to revert back to the initial history & viewport position if the message
       * is not available in the history.
       * Automatically captures the viewport position and puts it in origin
       */
      reversible?: boolean
      origin?: ViewportPosition
      /** Set false to disable highlight, true by default */
      highlight?: boolean
    }
  | { kind: 'Unread', cmid: Message.Cmid }

export type LoadConvoHistoryLock = {
  status: 'loading' | 'error'
  startCmid: Message.Cmid
  controller: AbortController
}

export type ConvoSession = {
  anchorCmid: Message.Cmid | 0
  viewportPosition?: ViewportPosition
  navigationRequest?: NavigationRequest
  loadLocks: Map<'around' | 'up' | 'down', LoadConvoHistoryLock>
  /**
   * A handler from the last convo. If loading completes after the convo has been reopened,
   * it can still access the latest historyElement and correct the viewport position
   */
  onHistoryLoadComplete?: (startCmid: Message.Cmid) => void
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
    sendMessageLock: new Set(),
    typings: new Map()
  }),

  actions: {
    requestNavigation(peerId: Peer.Id, request: NavigationRequest) {
      const session = this.convoSessions.get(peerId)
      if (session) {
        session.navigationRequest = request
        return
      }

      const stop = watch(() => this.convoSessions.get(peerId), (session) => {
        if (session) {
          stop()
          session.navigationRequest = request
        }
      }, { flush: 'sync' })
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
