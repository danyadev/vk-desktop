import { defineStore } from 'pinia'
import { RendererStorage } from 'model/Storage'
import { resolveZeroUserId, UserId } from 'model/Peer'

type Viewer = {
  id: UserId
  accounts: Array<{
    id: UserId
    firstName: string
    lastName: string
    photo100: string
    accessToken: string
  }>
}

const viewerStorage = new RendererStorage<Viewer>('viewer', {
  id: resolveZeroUserId(),
  accounts: []
})

export const useViewerStore = defineStore('viewer', {
  state: () => viewerStorage.data
})

export function init() {
  useViewerStore().$subscribe((mutation, state) => {
    viewerStorage.update(state)
  })
}
