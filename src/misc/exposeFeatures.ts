import { useMainSettingsStore } from 'store/mainSettings'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'
import { useEnv } from 'misc/hooks'

/**
 * Вытаскиваем полезные функции/переменные/etc в глобальную область видимости,
 * чтобы пользоваться этим в DevTools для дебага
 *
 * Создаем отдельную переменную для window, чтобы не менять тип глобального объекта
 * и не пользоваться глобальными переменными в коде
 */

type ExposedFeatures = {
  mainSettings: ReturnType<typeof useMainSettingsStore>
  settings: ReturnType<typeof useSettingsStore>
  viewer: ReturnType<typeof useViewerStore>
  api: ReturnType<typeof useEnv>['api']
}
const exposedWindow = window as typeof window & ExposedFeatures

export function exposeFeatures() {
  const { api } = useEnv()

  exposedWindow.mainSettings = useMainSettingsStore()
  exposedWindow.settings = useSettingsStore()
  exposedWindow.viewer = useViewerStore()
  exposedWindow.api = api
}
