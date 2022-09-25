import './schemes/bright_light.css'
import './schemes/space_gray.css'
import './schemes/vkcom_light.css'
import './schemes/vkcom_dark.css'
import './styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initStores } from 'store'
import { exposeFeatures } from 'misc/exposeFeatures'
import { App } from 'ui/app/App/App'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
initStores()

app.mount('body')

exposeFeatures()
