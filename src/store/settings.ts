import { defineStore } from 'pinia'
import { RendererStorage } from 'store/Storage'
import { Locale } from 'lang/dictionaries'

export type Settings = {
  lang: Locale
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
