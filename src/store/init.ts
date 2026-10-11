import { init as initConvoDrafts } from 'store/convoDrafts'
import { init as initConvos } from 'store/convos'
import { init as initMainSettings } from 'store/mainSettings'
import { init as initSettings } from 'store/settings'
import { init as initViewer } from 'store/viewer'

/** Синхронизирует обновления сторов с localStorage */
export function initStores() {
  initConvoDrafts()
  initConvos()
  initMainSettings()
  initSettings()
  initViewer()
}
