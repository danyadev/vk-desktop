import { computed, reactive } from 'vue'
import { Lang } from 'env/Lang'
import { useSettingsStore } from 'store/settings'

export function useEnv() {
  const settingsStore = useSettingsStore()

  const lang = computed(() => new Lang(settingsStore.lang))

  return reactive({
    lang
  })
}
