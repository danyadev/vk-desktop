import Electron from 'electron'
import { toRaw } from 'vue'
import { defineStore } from 'pinia'
import { MainStorage } from 'store/Storage'
import { currentWindow } from 'misc/utils'
import { shouldUseCustomTitlebar } from 'main-process/shared'

export type AppearanceScheme = 'vkcom' | 'vkui'
export type AppearanceTheme = 'light' | 'dark' | 'system'

export type MainSettings = {
  bounds: Electron.Rectangle
  useCustomTitlebar: boolean
  appearance: {
    scheme: AppearanceScheme
    theme: AppearanceTheme
  }
  alwaysOnTop: boolean
}

const mainSettingsStorage = new MainStorage<MainSettings>({
  // Дефолтные значения используются только один раз, причем не сразу
  get bounds() {
    return currentWindow.getBounds()
  },
  useCustomTitlebar: shouldUseCustomTitlebar,
  appearance: {
    scheme: 'vkcom',
    theme: 'system'
  },
  alwaysOnTop: false
})

export const useMainSettingsStore = defineStore('mainSettings', {
  state: () => mainSettingsStorage.data
})

export function init() {
  useMainSettingsStore().$subscribe((mutation, state) => {
    mainSettingsStorage.update(toRaw(state))
  })
}
