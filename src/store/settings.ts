import { defineStore } from 'pinia'
import type Electron from 'electron'
import { RendererStorage } from 'model/Storage'
import { currentWindow } from 'misc/utils'

export type Settings = {
  window: Electron.Rectangle
  lang: 'ru'
}

const settingsStorage = new RendererStorage<Settings>('settings', {
  window: currentWindow.getBounds(),
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
