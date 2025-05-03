import { computed, defineComponent, shallowRef, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers } from 'actions'
import { useEnv } from 'hooks'
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
  const { scrollAnchors } = useConvosStore()

  return () => {
    const pinnedMessage = props.convo.kind === 'ChatConvo' && props.convo.pinnedMessage

    return (
      <div class="ConvoView">
        <ConvoHeader convo={props.convo} />
        {pinnedMessage && (
          <PinnedMessage
            pinnedMessage={pinnedMessage}
            onClick={() => {
              scrollAnchors.set(props.convo.id, {
                kind: 'Message',
                cmid: pinnedMessage.cmid
              })
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
  const { connection } = useConvosStore()
  const { api } = useEnv()

  const peerId = computed(() => {
    const rawPeerId = Number(route.params.peerId)
    return rawPeerId && Peer.resolveId(rawPeerId)
  })
  const convo = computed(() => peerId.value && Convo.get(peerId.value))
  const isLoadingFailed = shallowRef(false)

  const loadConvo = async () => {
    isLoadingFailed.value = false

    try {
      const { items, profiles, groups } = await api.fetch('messages.getConversationsById', {
        peer_ids: peerId.value,
        extended: 1,
        fields: PEER_FIELDS
      })
      insertConvos(
        items.map((conversation) => ({ conversation })),
        { addToList: false }
      )
      insertPeers({ profiles, groups })
    } catch {
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
