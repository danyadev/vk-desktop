import { computed, reactive } from 'vue'
import { Lang } from 'env/Lang'
import { Api } from 'env/Api'
import { useSettingsStore } from 'store/settings'
import { createSingletonHook } from 'misc/utils'

export const useEnv = createSingletonHook(() => {
  const settings = useSettingsStore()

  const lang = computed(() => new Lang(settings.lang))
  const api = computed(() => new Api())

  return reactive({
    lang,
    api
  })
})
