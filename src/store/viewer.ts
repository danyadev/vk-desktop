import { defineStore } from 'pinia'
import * as Peer from 'model/Peer'
import { RendererStorage } from 'model/Storage'

type ViewerUser = Peer.User & {
  accessToken: string
  androidToken: string
}

type Viewer = {
  id: Peer.UserId
  accounts: Map<Peer.UserId, ViewerUser>
  /** Record<login, hash> */
  trustedHashes: Record<string, string>
}

const viewerStorage = new RendererStorage<Viewer>('viewer', {
  id: Peer.resolveZeroUserId(),
  accounts: new Map(),
  trustedHashes: {}
})

export const useViewerStore = defineStore('viewer', {
  state: () => viewerStorage.data,
  getters: {
    viewer(state) {
      return state.accounts.get(state.id)
    }
  },
  actions: {
    addAccount(account: ViewerUser) {
      this.accounts.set(account.id, account)
    },
    setCurrentAccount(userId: Peer.UserId) {
      this.id = userId
    },
    addTrustedHash(login: string, hash: string) {
      this.trustedHashes[login] = hash
    }
  }
})

export function init() {
  useViewerStore().$subscribe((mutation, state) => {
    viewerStorage.update(state)
  })
}
