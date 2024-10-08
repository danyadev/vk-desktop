import { defineStore } from 'pinia'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'

type Convos = {
  convos: Map<Peer.Id, Convo.Convo>
  convoList: {
    peerIds: Peer.Id[]
    hasMore: boolean
    loading: boolean
    loadError: boolean
  }
  connection: {
    status: 'init' | 'initFailed' | 'connected' | 'syncing'
  }
  loadConvoHistoryLock: Map<`${Peer.Id}-${'around' | 'up' | 'down'}`, 'loading' | 'error'>
  savedConvoScroll: Map<Peer.Id, number>
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
    connection: {
      status: 'init'
    },
    loadConvoHistoryLock: new Map(),
    savedConvoScroll: new Map()
  })
})

// defineStore оборачивает стейт в UnwrapRef, заставляя IDE показывать полный бред.
// Добавляем стейт в исключение, считая, что его значение не является рефом
declare module '@vue/reactivity' {
  interface RefUnwrapBailTypes {
    Convos: Convos
  }
}
