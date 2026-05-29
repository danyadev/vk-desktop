import { watch } from 'vue'
import { Api } from 'services/Api'
import { Auth } from 'services/Auth'
import { Engine } from 'services/Engine'
import { Lang } from 'services/Lang'
import { QrCodeAuth } from 'services/QrCodeAuth'
import { Uploader } from 'services/Uploader'
import { useSettingsStore } from 'store/settings'
import { createSingletonHook } from 'misc/utils'

export const useServices = createSingletonHook(() => {
  const settings = useSettingsStore()

  const lang = new Lang(settings.lang)
  const api = new Api((exchangeToken: string): Promise<string> => (
    auth.refreshByExchangeToken(exchangeToken)
  ))
  const auth = new Auth(api)
  const engine = new Engine()
  const uploader = new Uploader(api)
  const qrCodeAuth = new QrCodeAuth(auth, lang)

  watch(() => settings.lang, () => lang.onLocaleUpdate(settings.lang))

  return {
    lang,
    api,
    auth,
    engine,
    uploader,
    qrCodeAuth
  }
})
