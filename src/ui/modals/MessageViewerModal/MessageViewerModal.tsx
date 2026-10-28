import { defineComponent, KeepAlive, nextTick, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { createConvoSession } from 'store/convos'
import { provideConvoSession, useGlobalModal } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { FetchedMessageView } from './FetchedMessageView'
import { HistoryMessages } from 'ui/messenger/ConvoHistory/HistoryMessages'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24ChevronCompactLeft } from 'assets/icons'
import './MessageViewerModal.css'

export type MessageViewerParams =
  | { messages: NonEmptyArray<Message.Message | Message.Foreign> }
  | { peerId: Peer.Id, cmid: Message.Cmid }

export const MessageViewerModal = defineComponent(() => {
  const { lang } = useServices()
  const { messageViewerModal } = useGlobalModal()
  const session = createConvoSession()
  const $body = shallowRef<HTMLElement | null>(null)
  provideConvoSession(session)

  watch(() => session.navigationRequest, (request) => {
    if (!request) return

    session.navigationRequest = undefined
    if (request.kind !== 'Message') return

    const params = messageViewerModal.current?.params
    if (!params) return

    const peerId = 'messages' in params ? params.messages[0].peerId : params.peerId
    if (peerId) {
      messageViewerModal.open({ peerId, cmid: request.cmid })
    }
  })

  watch(() => messageViewerModal.current, async (newViewer, prevViewer) => {
    if (prevViewer && $body.value) {
      prevViewer.scrollTop = $body.value.scrollTop
    }

    await nextTick()

    if (messageViewerModal.current === newViewer && $body.value) {
      $body.value.scrollTop = newViewer?.scrollTop ?? 0
    }
  }, { flush: 'sync' })

  return () => {
    const entry = messageViewerModal.current
    if (!entry) return null
    const { params } = entry

    return (
      <Modal
        opened={messageViewerModal.opened}
        onClose={messageViewerModal.close}
        onVisibilityChange={messageViewerModal.onVisibilityChange}
        withoutBodyPadding
        class="MessageViewerModal"
        title={
          <div class="MessageViewerModal__header">
            {messageViewerModal.canGoBack && (
              <ButtonIcon
                class="MessageViewerModal__back"
                icon={<Icon24ChevronCompactLeft />}
                withHoverBackground
                onClick={messageViewerModal.back}
              />
            )}
            <span>{lang.use('messageViewerModal_title')}</span>
          </div>
        }
        buttons={
          <Button onClick={messageViewerModal.close}>
            {lang.use('modal_close_label')}
          </Button>
        }
      >
        <div class="MessageViewerModal__scroll" ref={$body}>
          <KeepAlive>
            {'messages' in params ? (
              <HistoryMessages key={entry.id} messages={params.messages} hasMessagesAbove={false} />
            ) : (
              <FetchedMessageView key={entry.id} peerId={params.peerId} cmid={params.cmid} />
            )}
          </KeepAlive>
        </div>
      </Modal>
    )
  }
})
