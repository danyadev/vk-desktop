import { createRouter, createWebHashHistory } from 'vue-router'
import { useViewerStore } from 'store/viewer'
import { Auth } from 'ui/Auth/Auth'
import { ConvoWrapper } from 'ui/messenger/ConvoView/ConvoView'
import { Messenger } from 'ui/messenger/Messenger/Messenger'
import { NoConvo } from 'ui/messenger/NoConvo/NoConvo'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: Messenger,
      beforeEnter() {
        const viewer = useViewerStore()
        if (viewer.id === 0) {
          return { path: '/auth' }
        }
      },
      children: [
        {
          path: '/',
          component: NoConvo
        },
        {
          name: 'Convo',
          path: '/convo/:peerId',
          component: ConvoWrapper
        }
      ]
    },
    {
      path: '/auth',
      component: Auth
    }
  ]
})
