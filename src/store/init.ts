import { init as initMainSettings } from 'store/mainSettings'
import { init as initSettings } from 'store/settings'
import { init as initViewer } from 'store/viewer'

export function initStores() {
  initMainSettings()
  initSettings()
  initViewer()
}
