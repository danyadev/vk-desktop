import { defineComponent, onUnmounted, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as IApi from 'services/contracts/IApi'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { createConvoSession } from 'store/convos'
import { insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { provideConvoSession, useGlobalModal } from 'hooks'
import { PEER_FIELDS } from 'misc/constants'
import { HistoryMessages } from 'ui/messenger/ConvoHistory/HistoryMessages'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './MessagePreviewModal.css'

type LoadStatus = 'loading' | 'loaded' | 'loadError' | 'unavailable'

export type MessagePreviewModalProps = {
  peerId: Peer.Id
  cmid: Message.Cmid
}

export const MessagePreviewModal = defineComponent<MessagePreviewModalProps>((props) => {
  const { api, lang } = useServices()
  const { messagePreviewModal } = useGlobalModal()
  const session = createConvoSession()
  provideConvoSession(session)

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
      const { items, profiles, groups } = await api.fetch('messages.getByConversationMessageId', {
        peer_id: props.peerId,
        conversation_message_ids: props.cmid,
        extended: 1,
        fields: PEER_FIELDS
      }, { signal: controller.signal })

      if (controller.signal.aborted) return

      if (!items[0]) {
        status.value = 'unavailable'
        return
      }

      insertPeers({ profiles, groups })
      message.value = fromApiMessage(items[0])
      status.value = 'loaded'
    } catch (err) {
      if (controller.signal.aborted) return

      console.warn('[MessagePreviewModal] loading error', err)
      status.value = err instanceof IApi.MethodError ? 'unavailable' : 'loadError'
    }
  }

  watch(() => [props.peerId, props.cmid], loadMessage, { immediate: true })
  watch(() => messagePreviewModal.opened, (opened) => {
    if (!opened) abortController?.abort('Message preview closed')
  })

  watch(() => session.navigationRequest, (request) => {
    if (!request) return
    session.navigationRequest = undefined

    if (request.kind === 'Message') {
      messagePreviewModal.open({ peerId: props.peerId, cmid: request.cmid })
    }
  })

  onUnmounted(() => {
    abortController?.abort('Message preview unmounted')
  })

  return () => (
    <Modal
      opened={messagePreviewModal.opened}
      onClose={messagePreviewModal.close}
      onVisibilityChange={messagePreviewModal.onVisibilityChange}
      title={lang.use('messagePreviewModal_title')}
      buttons={
        <Button onClick={messagePreviewModal.close}>
          {lang.use('modal_close_label')}
        </Button>
      }
      class="MessagePreviewModal"
    >
      <div
        class={[
          (status.value === 'loading' || status.value === 'unavailable') &&
            'MessagePreviewModal__content--centered'
        ]}
      >
        {status.value === 'loading' ? (
          <Spinner size="regular" />
        ) : status.value === 'loadError' ? (
          <LoadError onRetry={loadMessage} />
        ) : status.value === 'unavailable' ? (
          <div class="MessagePreviewModal__unavailable">
            {lang.use('messagePreviewModal_unavailable')}
          </div>
        ) : message.value ? (
          <HistoryMessages messages={[message.value]} hasMessagesAbove={false} />
        ) : null}
      </div>
    </Modal>
  )
}, { props: ['peerId', 'cmid'] })
