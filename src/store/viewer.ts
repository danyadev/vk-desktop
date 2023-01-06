import { defineStore } from 'pinia'
import { RendererStorage } from 'model/Storage'
import * as Peer from 'model/Peer'

type ViewerUser = Peer.User & { accessToken: string }

type Viewer = {
  id: Peer.UserId
  accounts: ViewerUser[]
  /** Record<login, hash> */
  trustedHashes: Record<string, string>
}

const viewerStorage = new RendererStorage<Viewer>('viewer', {
  id: Peer.resolveZeroUserId(),
  accounts: [],
  trustedHashes: {}
})

export const useViewerStore = defineStore('viewer', {
  state: () => viewerStorage.data,
  actions: {
    addAccount(account: ViewerUser) {
      const index = this.accounts.findIndex((acc) => acc.id === account.id)

      if (index === -1) {
        this.accounts.push(account)
      } else {
        this.accounts[index] = account
      }
    },
    setDefaultAccount(userId: Peer.UserId) {
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
