// eslint-disable-next-line simple-import-sort/imports
import './assets/schemes/vkcom-light.css'
import './assets/schemes/vkcom-dark.css'
import './assets/schemes/vkui-light.css'
import './assets/schemes/vkui-dark.css'
import './styles.css'
import 'vue/jsx'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createEnv, ENV_PROVIDE_KEY } from 'env/createEnv'
import { initStores } from 'store/init'
import { router } from './router'
import { App } from 'ui/app/App/App'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
initStores()

app.use(router)

const env = createEnv()
app.provide(ENV_PROVIDE_KEY, env)

app.mount('body')
