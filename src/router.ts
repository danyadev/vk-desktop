import { createRouter, createWebHashHistory, RouteRecordInfo } from 'vue-router'
import * as Peer from 'model/Peer'
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
          name: 'NoConvo',
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
      name: 'Auth',
      path: '/auth',
      component: Auth
    }
  ]
})

interface RouteNamedMap {
  NoConvo: RouteRecordInfo<
    'NoConvo',
    '/',
    Record<never, never>,
    Record<never, never>
  >
  Convo: RouteRecordInfo<
    'Convo',
    '/convo/:peerId',
    { peerId: Peer.Id },
    { peerId: string }
  >
  Auth: RouteRecordInfo<
    'Auth',
    '/auth',
    Record<never, never>,
    Record<never, never>
  >
}

declare module 'vue-router' {
  interface TypesConfig {
    RouteNamedMap: RouteNamedMap
  }
}
