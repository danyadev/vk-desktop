import { defineStore } from 'pinia'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'

type Convos = {
  convos: Map<Peer.Id, Convo.Convo>
  convoList: Peer.Id[]
  connectionStatus: 'init' | 'initFailed' | 'connected' | 'syncing'
}

export const useConvosStore = defineStore('convos', {
  state: (): Convos => ({
    convos: new Map(),
    convoList: [],
    connectionStatus: 'init'
  })
})
