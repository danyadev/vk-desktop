import { computed, reactive } from 'vue'
import { Api } from 'env/Api'
import { Engine } from 'env/Engine'
import { Lang } from 'env/Lang'
import { useSettingsStore } from 'store/settings'
import { createSingletonHook } from 'misc/utils'

export const useEnv = createSingletonHook(() => {
  const settings = useSettingsStore()

  const lang = computed(() => new Lang(settings.lang))
  const api = new Api()
  const engine = new Engine()

  return reactive({
    lang,
    api,
    engine
  })
})