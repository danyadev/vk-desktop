import { defineStore } from 'pinia'
import * as Peer from 'model/Peer'

type Peers = {
  peers: Map<Peer.Id, Peer.Peer>
}

export const usePeersStore = defineStore('peers', {
  state: (): Peers => ({
    peers: new Map()
  })
})

// defineStore оборачивает стейт в UnwrapRef, заставляя IDE показывать полный бред.
// Добавляем стейт в исключение, считая, что его значение не является рефом
declare module '@vue/reactivity' {
  interface RefUnwrapBailTypes {
    Peers: Peers
  }
}
