import { watch } from 'vue'
import { Api } from 'services/Api'
import { Engine } from 'services/Engine'
import { Lang } from 'services/Lang'
import { QrCodeAuth } from 'services/QrCodeAuth'
import { Uploader } from 'services/Uploader'
import { useSettingsStore } from 'store/settings'
import { createSingletonHook } from 'misc/utils'

export const useServices = createSingletonHook(() => {
  const settings = useSettingsStore()

  const lang = new Lang(settings.lang)
  const api = new Api()
  const engine = new Engine()
  const uploader = new Uploader(api)
  const qrCodeAuth = new QrCodeAuth(api, lang)

  watch(() => settings.lang, () => lang.onLocaleUpdate(settings.lang))

  return {
    lang,
    api,
    engine,
    uploader,
    qrCodeAuth
  }
})
