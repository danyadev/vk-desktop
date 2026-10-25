import { computed, defineComponent, shallowRef, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers } from 'actions'
import { provideConvoSession, useGlobalModal } from 'hooks'
import { PEER_FIELDS } from 'misc/constants'
import { ConvoComposer } from 'ui/messenger/ConvoComposer/ConvoComposer'
import { ConvoHeader } from 'ui/messenger/ConvoHeader/ConvoHeader'
import { ConvoHistory } from 'ui/messenger/ConvoHistory/ConvoHistory'
import { PinnedMessage } from 'ui/messenger/PinnedMessage/PinnedMessage'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoView.css'

type ConvoViewProps = {
  convo: Convo.Convo
}

const ConvoView = defineComponent<ConvoViewProps>((props) => {
  const convosStore = useConvosStore()
  const { messagePreviewModal } = useGlobalModal()
  const session = convosStore.getDefaultSession(props.convo.id, props.convo.inReadBy)
  provideConvoSession(session)

  return () => {
    const pinnedMessage = props.convo.kind === 'ChatConvo' && props.convo.pinnedMessage
    const hiddenPinnedMessageCmid = convosStore.hiddenPinnedMessages.get(props.convo.id)

    return (
      <div class="ConvoView">
        <ConvoHeader convo={props.convo} />
        {pinnedMessage && pinnedMessage.cmid !== hiddenPinnedMessageCmid && (
          <PinnedMessage
            pinnedMessage={pinnedMessage}
            onClick={() => {
              if (pinnedMessage.isUnavailable) {
                messagePreviewModal.open({ peerId: props.convo.id, cmid: pinnedMessage.cmid })
                return
              }
              session.navigationRequest = {
                kind: 'Message',
                cmid: pinnedMessage.cmid
              }
            }}
          />
        )}
        <ConvoHistory convo={props.convo} />
        <ConvoComposer convo={props.convo} />
      </div>
    )
  }
}, {
  props: ['convo']
})

export const ConvoWrapper = defineComponent(() => {
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
      return <LoadError onRetry={loadConvo} class="ConvoWrapper__loadError" />
    }

    return <Spinner class="ConvoWrapper__spinner" size="regular" />
  }
})
