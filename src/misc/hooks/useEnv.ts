import { computed, reactive } from 'vue'
import { Lang } from 'env/Lang'
import { Api } from 'env/Api'
import { useSettingsStore } from 'store/settings'

export function useEnv() {
  const settingsStore = useSettingsStore()

  const lang = computed(() => new Lang(settingsStore.lang))
  const api = computed(() => new Api())

  return reactive({
    lang,
    api
  })
}
