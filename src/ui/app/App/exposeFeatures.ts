import { useRouter } from 'vue-router'
import * as IApi from 'env/IApi'
import * as ILang from 'env/ILang'
import { QrCodeAuth } from 'env/QrCodeAuth'
import * as Auth from 'model/Auth'
import { useConvosStore } from 'store/convos'
import { useMainSettingsStore } from 'store/mainSettings'
import { usePeersStore } from 'store/peers'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'
import { useEnv } from 'hooks'
import * as utils from 'misc/utils'

/**
 * Вытаскиваем полезные функции/переменные/etc в глобальную область видимости,
 * чтобы пользоваться этим в DevTools для дебага
 *
 * Создаем отдельную переменную для window, чтобы не менять тип глобального объекта
 * и не пользоваться глобальными переменными в коде
 */

type ExposedFeatures = {
  mainSettings: ReturnType<typeof useMainSettingsStore>
  settings: ReturnType<typeof useSettingsStore>
  viewer: ReturnType<typeof useViewerStore>
  peers: ReturnType<typeof usePeersStore>
  convos: ReturnType<typeof useConvosStore>
  api: IApi.Api
  engine: ReturnType<typeof useEnv>['engine']
  lang: ILang.Lang
  auth: typeof Auth
  QrCodeAuth: typeof QrCodeAuth
  utils: typeof utils
  router: ReturnType<typeof useRouter>
}
const exposedWindow = window as typeof window & ExposedFeatures

export function exposeFeatures() {
  const { api, engine, lang } = useEnv()
  const router = useRouter()

  exposedWindow.mainSettings = useMainSettingsStore()
  exposedWindow.settings = useSettingsStore()
  exposedWindow.viewer = useViewerStore()
  exposedWindow.peers = usePeersStore()
  exposedWindow.convos = useConvosStore()
  exposedWindow.api = api
  exposedWindow.engine = engine
  exposedWindow.lang = lang
  exposedWindow.router = router
  exposedWindow.auth = { ...Auth }
  exposedWindow.QrCodeAuth = QrCodeAuth
  exposedWindow.utils = { ...utils }
}
