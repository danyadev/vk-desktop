import { defineStore } from 'pinia'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Peer from 'model/Peer'
import { RendererStorage } from 'store/Storage'

type ConvoDrafts = {
  drafts: Map<Peer.Id, ConvoDraft.ConvoDraft>
}

const convoDraftsStorage = new RendererStorage<ConvoDrafts>('convoDrafts', {
  drafts: new Map()
})

export const useConvoDraftsStore = defineStore('convoDrafts', {
  state: () => convoDraftsStorage.data
})

export function init() {
  useConvoDraftsStore().$subscribe((mutation, state) => {
    const draftsToSave = new Map<Peer.Id, ConvoDraft.ConvoDraft>()

    for (const [peerId, convoDraft] of state.drafts) {
      if (!ConvoDraft.isEmpty(convoDraft)) {
        draftsToSave.set(peerId, {
          ...convoDraft,
          // Мы не можем сохранять вложения в процессе загрузки в localStorage
          uploadingAttaches: []
        })
      }
    }

    convoDraftsStorage.update({ drafts: draftsToSave })
  })
}

// defineStore оборачивает стейт в UnwrapRef, заставляя IDE показывать полный бред.
// Добавляем стейт в исключение, считая, что его значение не является рефом
declare module '@vue/reactivity' {
  interface RefUnwrapBailTypes {
    ConvoDrafts: ConvoDrafts
  }
}
