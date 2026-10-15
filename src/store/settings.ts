import { defineStore } from 'pinia'
import { JsonStorage, LocalStorageBackend } from 'store/Storage'
import { Locale } from 'lang/dictionaries'

export type Settings = {
  lang: Locale
}

const settingsStorage = new JsonStorage<Settings>(
  new LocalStorageBackend('settings'),
  () => ({
    lang: 'ru'
  })
)

export const useSettingsStore = defineStore('settings', {
  state: () => settingsStorage.getState()
})

export function init() {
  useSettingsStore().$subscribe((mutation, state) => {
    settingsStorage.setState(state)
  })
}
