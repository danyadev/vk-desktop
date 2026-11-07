import { computed, defineComponent, shallowRef, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useServices } from 'services'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers } from 'actions'
import { PEER_FIELDS } from 'misc/constants'
import { ConvoView } from 'ui/messenger/ConvoView/ConvoView'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoPane.css'

export const ConvoPane = defineComponent(() => {
  const route = useRoute('Convo')
  const { connection, convos } = useConvosStore()
  const { api } = useServices()

  const peerId = computed(() => Peer.resolveId(Number(route.params.peerId)))
  const convo = computed(() => convos.get(peerId.value))
  const isLoadingFailed = shallowRef(false)

  const loadConvo = async () => {
    isLoadingFailed.value = false

    try {
      const {
        items,
        last_messages: apiLastMessages = [],
        profiles,
        groups
      } = await api.fetch('messages.getConversationsById', {
        peer_ids: peerId.value,
        with_last_messages: 1,
        extended: 1,
        fields: PEER_FIELDS
      })

      const [apiConvo] = items
      const [apiLastMessage] = apiLastMessages
      if (!apiConvo) {
        throw new Error('No conversation fetched for ' + peerId.value)
      }

      insertConvos([{ conversation: apiConvo, last_message: apiLastMessage }])
      insertPeers({ profiles, groups })
    } catch (err) {
      console.warn(err)
      isLoadingFailed.value = true
    }
  }

  watchEffect(() => {
    if (!convo.value && connection.status === 'connected' && !isLoadingFailed.value) {
      loadConvo()
    }
  })

  return () => {
    if (convo.value) {
      return <ConvoView convo={convo.value} />
    }

    if (isLoadingFailed.value) {
      return <LoadError onRetry={loadConvo} class="ConvoPane__loadError" />
    }

    return <Spinner class="ConvoPane__spinner" size="regular" />
  }
})
