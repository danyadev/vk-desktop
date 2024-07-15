import { defineStore } from 'pinia'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'

type Convos = {
  convos: Map<Peer.Id, Convo.Convo>
  convoList: {
    peerIds: Peer.Id[]
    hasMore: boolean
    loading: boolean
  }
  connection: {
    status: 'init' | 'initFailed' | 'connected' | 'syncing'
  }
  loadingConvosHistory: Set<`${Peer.Id}-${Message.Cmid}`>
  convoScrollPositions: Map<Peer.Id, number>
}

export const useConvosStore = defineStore('convos', {
  state: (): Convos => ({
    convos: new Map(),
    convoList: {
      peerIds: [],
      hasMore: true,
      loading: true
    },
    connection: {
      status: 'init'
    },
    loadingConvosHistory: new Set(),
    convoScrollPositions: new Map()
  })
})

// defineStore оборачивает стейт в UnwrapRef, заставляя IDE показывать полный бред.
// Добавляем стейт в исключение, считая, что его значение не является рефом
declare module '@vue/reactivity' {
  interface RefUnwrapBailTypes {
    Convos: Convos
  }
}
