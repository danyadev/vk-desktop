import { defineStore } from 'pinia'
import { RendererStorage } from 'model/Storage'

type Settings = {
  appearance: {
    theme: 'light' | 'dark',
    scheme: 'vkcom' | 'vkui'
  }
}

const settingsStorage = new RendererStorage<Settings>('settings', {
  appearance: {
    theme: 'light',
    scheme: 'vkcom'
  }
})

export const useSettingsStore = defineStore('settings', {
  state: () => settingsStorage.data
})

export function init() {
  useSettingsStore().$subscribe((mutation, state) => {
    settingsStorage.update(state)
  })
}
