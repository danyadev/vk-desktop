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
