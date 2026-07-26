import { defineComponent, onUnmounted, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as IApi from 'services/contracts/IApi'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { PEER_FIELDS } from 'misc/constants'
import { HistoryMessages } from 'ui/messenger/ConvoHistory/HistoryMessages'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './MessagePreviewModal.css'

type Props = {
  opened: boolean
  onClose: () => void
  convo: Convo.Convo
  cmid: Message.Cmid
}

export const MessagePreviewModal = defineComponent<Props>((props) => {
  const { api, lang } = useServices()
  const message = shallowRef<Message.Confirmed>()
  const status = shallowRef<'loading' | 'loaded' | 'loadError' | 'unavailable'>('loading')
  const activeCmid = shallowRef<Message.Cmid>(props.cmid)
  let abortController: AbortController | undefined

  const loadMessage = async (cmid: Message.Cmid) => {
    activeCmid.value = cmid
    abortController?.abort('Message preview request superseded')

    const controller = new AbortController()
    abortController = controller

    message.value = undefined
    status.value = 'loading'

    try {
      const { items, profiles, groups } = await api.fetch('messages.getByConversationMessageId', {
        peer_id: props.convo.id,
        conversation_message_ids: cmid,
        extended: 1,
        fields: PEER_FIELDS
      }, { signal: controller.signal })

      if (controller.signal.aborted) {
        return
      }

      const apiMessage = items[0]
      if (!apiMessage) {
        status.value = 'unavailable'
        return
      }

      insertPeers({ profiles, groups })

      message.value = fromApiMessage(apiMessage)
      status.value = 'loaded'
    } catch (err) {
      if (controller.signal.aborted) {
        return
      }

      console.warn('[MessagePreviewModal] loading error', err)

      if (err instanceof IApi.MethodError) {
        status.value = 'unavailable'
      } else {
        status.value = 'loadError'
      }
    }
  }

  watch([() => props.opened, () => props.cmid], ([opened]) => {
    if (opened) {
      loadMessage(props.cmid)
    } else {
      abortController?.abort('Message preview closed')
    }
  }, { immediate: true })

  onUnmounted(() => {
    abortController?.abort('Message preview unmounted')
  })

  return () => (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      title={lang.use('messagePreviewModal_title')}
      buttons={
        <Button onClick={props.onClose}>
          {lang.use('modal_close_label')}
        </Button>
      }
      class="MessagePreviewModal"
    >
      <div
        class={[
          'MessagePreviewModal__content',
          (status.value === 'loading' || status.value === 'unavailable') &&
            'MessagePreviewModal__content--centered'
        ]}
      >
        {status.value === 'loading' ? (
          <Spinner size="regular" />
        ) : status.value === 'loadError' ? (
          <LoadError onRetry={() => loadMessage(activeCmid.value)} />
        ) : status.value === 'unavailable' ? (
          <div class="MessagePreviewModal__unavailable">
            {lang.use('messagePreviewModal_unavailable')}
          </div>
        ) : message.value ? (
          <HistoryMessages
            convo={props.convo}
            messages={[message.value]}
            hasMessagesAbove={false}
            openMessagePreview={loadMessage}
          />
        ) : null}
      </div>
    </Modal>
  )
}, {
  props: ['opened', 'onClose', 'convo', 'cmid']
})
