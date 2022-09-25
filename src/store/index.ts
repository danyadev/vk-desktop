import { init as initMainSettings } from 'store/mainSettings'
import { init as initSettings } from 'store/settings'

export function initStores() {
  initMainSettings()
  initSettings()
}
