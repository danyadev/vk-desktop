import { Lang } from 'env/Lang'
import { useSettingsStore } from 'store/settings'

export function useEnv() {
  const settingsStore = useSettingsStore()
  const lang = new Lang(settingsStore.lang)

  return {
    lang
  }
}
