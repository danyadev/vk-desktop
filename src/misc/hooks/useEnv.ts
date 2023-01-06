import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Lang } from 'env/Lang'
import { Api } from 'env/Api'
import { useSettingsStore } from 'store/settings'
import { createSingletonHook } from 'misc/utils'

export const useEnv = createSingletonHook(() => {
  const settings = useSettingsStore()

  const lang = computed(() => new Lang(settings.lang))
  const api = new Api()
  const router = useRouter()

  return reactive({
    lang,
    api,
    router
  })
})
