import { defineStore } from 'pinia'
import { RendererStorage } from 'model/Storage'

export type Settings = {
  lang: 'ru'
}

const settingsStorage = new RendererStorage<Settings>('settings', {
  lang: 'ru'
})

export const useSettingsStore = defineStore('settings', {
  state: () => settingsStorage.data
})

export function init() {
  useSettingsStore().$subscribe((mutation, state) => {
    settingsStorage.update(state)
  })
}
