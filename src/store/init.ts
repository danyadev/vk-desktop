import { init as initMainSettings } from 'store/mainSettings'
import { init as initSettings } from 'store/settings'
import { init as initViewer } from 'store/viewer'

/** Синхронизирует обновления сторов с localStorage */
export function initStores() {
  initMainSettings()
  initSettings()
  initViewer()
}
