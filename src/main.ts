// eslint-disable-next-line simple-import-sort/imports
import './assets/schemes/vkcom-light.css'
import './assets/schemes/vkcom-dark.css'
import './assets/schemes/vkui-light.css'
import './assets/schemes/vkui-dark.css'
import './styles.css'
import 'vue/jsx'
// eslint-disable-next-line import-x/extensions
import './vue-jsx-events.d.ts'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initStores } from 'store/init'
import { router } from './router'
import { App } from 'ui/app/App/App'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
initStores()

app.use(router)

app.mount('body')
