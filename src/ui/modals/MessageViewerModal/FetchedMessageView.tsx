import { defineComponent, onActivated, onDeactivated, onUnmounted, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as IApi from 'services/contracts/IApi'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { PEER_FIELDS } from 'misc/constants'
import { HistoryMessages } from 'ui/messenger/ConvoHistory/HistoryMessages'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'

type LoadStatus = 'loading' | 'loaded' | 'loadError' | 'unavailable'

type Props = {
  peerId: Peer.Id
  cmid: Message.Cmid
}

export const FetchedMessageView = defineComponent<Props>((props) => {
  const { api, lang } = useServices()
  const message = shallowRef<Message.Confirmed>()
  const status = shallowRef<LoadStatus>('loading')
  let abortController: AbortController | undefined

  const loadMessage = async () => {
    abortController?.abort('Message preview request superseded')
    message.value = undefined

    const controller = new AbortController()
    abortController = controller
    status.value = 'loading'

    try {
      const {
        items: [apiMessage],
        profiles,
        groups
      } = await api.fetch('messages.getByConversationMessageId', {
        peer_id: props.peerId,
        conversation_message_ids: props.cmid,
        extended: 1,
        fields: PEER_FIELDS
      }, { signal: controller.signal })

      if (controller.signal.aborted) return
      if (!apiMessage) {
        status.value = 'unavailable'
        return
      }

      insertPeers({ profiles, groups })
      message.value = fromApiMessage(apiMessage)
      status.value = 'loaded'
    } catch (err) {
      if (controller.signal.aborted) return

      console.warn('[FetchedMessageView] loading error', err)
      status.value = err instanceof IApi.MethodError ? 'unavailable' : 'loadError'
    }
  }

  watch(() => [props.peerId, props.cmid], loadMessage, { immediate: true })
  onDeactivated(() => abortController?.abort('Message preview hidden'))
  onActivated(() => {
    if (status.value === 'loading' && abortController?.signal.aborted) loadMessage()
  })
  onUnmounted(() => abortController?.abort('Message preview unmounted'))

  return () => (
    <div
      class={(status.value === 'loading' || status.value === 'unavailable') &&
        'MessageViewerModal__centered'}
    >
      {status.value === 'loading' ? (
        <Spinner size="regular" />
      ) : status.value === 'loadError' ? (
        <LoadError onRetry={loadMessage} />
      ) : status.value === 'unavailable' ? (
        <div class="MessageViewerModal__unavailable">
          {lang.use('messageViewerModal_unavailable')}
        </div>
      ) : message.value ? (
        <HistoryMessages messages={[message.value]} hasMessagesAbove={false} />
      ) : null}
    </div>
  )
}, {
  props: ['peerId', 'cmid']
})
