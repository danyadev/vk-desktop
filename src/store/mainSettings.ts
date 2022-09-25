import os from 'os'
import { defineStore } from 'pinia'
import { MainStorage } from 'model/Storage'

export type AppearanceScheme = 'vkcom' | 'vkui'
export type AppearanceTheme = 'light' | 'dark' | 'system'

type MainSettings = {
  useCustomTitlebar: boolean,
  appearance: {
    scheme: AppearanceScheme
    theme: AppearanceTheme
  }
}

const mainSettingsStorage = new MainStorage<MainSettings>({
  // Включаем кастомный тайтлбар только для винды < 10 версии
  useCustomTitlebar: process.platform === 'win32' && parseInt(os.release()) < 10,
  appearance: {
    scheme: 'vkcom',
    theme: 'system'
  }
})

export const useMainSettingsStore = defineStore('mainSettings', {
  state: () => mainSettingsStorage.data
})

export function init() {
  useMainSettingsStore().$subscribe((mutation, state) => {
    mainSettingsStorage.update(state)
  })
}
