import './assets/schemes/bright_light.css'
import './assets/schemes/space_gray.css'
import './assets/schemes/vkcom_light.css'
import './assets/schemes/vkcom_dark.css'
import './styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initStores } from 'store/init'
import { router } from 'env/router'
import { exposeFeatures } from 'misc/exposeFeatures'
import { App } from 'ui/app/App/App'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
initStores()

app.use(router)

app.mount('body')

exposeFeatures()
