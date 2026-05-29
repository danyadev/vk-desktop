import { computed, reactive } from 'vue'
import { Api } from 'services/Api'
import { Engine } from 'services/Engine'
import { Lang } from 'services/Lang'
import { Uploader } from 'services/Uploader'
import { useSettingsStore } from 'store/settings'
import { createSingletonHook } from 'misc/utils'

export const useServices = createSingletonHook(() => {
  const settings = useSettingsStore()

  const lang = computed(() => new Lang(settings.lang))
  const api = new Api()
  const engine = new Engine()
  const uploader = new Uploader(api)

  return reactive({
    lang,
    api,
    engine,
    uploader
  })
})
