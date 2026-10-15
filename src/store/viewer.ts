import { defineStore } from 'pinia'
import * as Peer from 'model/Peer'
import { JsonStorage, LocalStorageBackend } from 'store/Storage'

export type ViewerUser = Peer.User & {
  accessToken: string
  messengerToken: string
  messengerExchangeToken: string
}

type Viewer = {
  id: Peer.UserId
  accounts: Map<Peer.UserId, ViewerUser>
  /** Record<login, hash> */
  trustedHashes: Record<string, string>
}

const viewerStorage = new JsonStorage<Viewer>(
  new LocalStorageBackend('viewer'),
  () => ({
    id: Peer.resolveZeroUserId(),
    accounts: new Map(),
    trustedHashes: {}
  })
)

export const useViewerStore = defineStore('viewer', {
  state: () => viewerStorage.getState(),
  getters: {
    viewer(state) {
      return state.accounts.get(state.id)
    }
  },
  actions: {
    addAccount(account: ViewerUser) {
      this.accounts.set(account.id, account)
    },
    deleteAccount(userId: Peer.UserId) {
      this.accounts.delete(userId)
    },
    setCurrentAccount(userId: Peer.UserId) {
      if (this.id === userId) return
      this.id = userId
      location.reload()
    },
    logout() {
      this.setCurrentAccount(Peer.resolveZeroUserId())
    },
    addTrustedHash(login: string, hash: string) {
      this.trustedHashes[login] = hash
    }
  }
})

export function init() {
  useViewerStore().$subscribe((mutation, state) => {
    viewerStorage.setState(state)
  }, { flush: 'sync' })
}

// defineStore оборачивает стейт в UnwrapRef, заставляя IDE показывать полный бред.
// Добавляем стейт в исключение, считая, что его значение не является рефом
declare module '@vue/reactivity' {
  interface RefUnwrapBailTypes {
    Viewer: Viewer
  }
}
