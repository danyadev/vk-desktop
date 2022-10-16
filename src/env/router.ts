import { createRouter, createMemoryHistory } from 'vue-router'
import { useViewerStore } from 'store/viewer'
import { Auth } from 'ui/Auth/Auth'
import { Messenger } from 'ui/messenger/Messenger/Messenger'

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: Messenger,
      beforeEnter() {
        const viewer = useViewerStore()
        if (viewer.id === 0) {
          return { path: '/auth' }
        }
      }
    },
    {
      path: '/auth',
      component: Auth
    }
  ]
})
