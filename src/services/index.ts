import { watch } from 'vue'
import { Api } from 'services/Api'
import { Auth } from 'services/Auth'
import { Engine } from 'services/Engine'
import { Lang } from 'services/Lang'
import { QrCodeAuth } from 'services/QrCodeAuth'
import { Uploader } from 'services/Uploader'
import { useSettingsStore } from 'store/settings'

type Services = {
  lang: Lang
  api: Api
  auth: Auth
  qrCodeAuth: QrCodeAuth
  engine: Engine
  uploader: Uploader
}

let services: Services | undefined

export function initServices() {
  if (services) {
    throw new Error('Services are already initialized')
  }

  const settings = useSettingsStore()

  const lang = new Lang(settings.lang)
  const api = new Api((exchangeToken: string): Promise<string> => (
    auth.refreshByExchangeToken(exchangeToken)
  ))
  const auth = new Auth(api)
  const qrCodeAuth = new QrCodeAuth(auth, lang)
  const engine = new Engine(api)
  const uploader = new Uploader(api)

  watch(() => settings.lang, (locale) => lang.onLocaleUpdate(locale))

  services = {
    lang,
    api,
    auth,
    qrCodeAuth,
    engine,
    uploader
  }
}

export function useServices(): Services {
  if (!services) {
    throw new Error('Services are not initialized')
  }

  return services
}
