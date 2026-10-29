import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'
import { useViewerStore } from 'store/viewer'
import { retryAllPendingMessages, retryPendingMessage } from 'actions'
import { useConvoSession, useModal } from 'hooks'
import { DeleteMessageModal } from 'ui/messenger/DeleteMessageModal/DeleteMessageModal'
import { MessageReadersMenuItem } from 'ui/messenger/MessageActionMenu/MessageReadersMenuItem'
import { Modal } from 'ui/modals/parts'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ActionMenuSeparator } from 'ui/ui/ActionMenuSeparator/ActionMenuSeparator'
import { Button } from 'ui/ui/Button/Button'
import { Popper } from 'ui/ui/Popper/Popper'
import {
  Icon20ArrowUturnLeftOutline,
  Icon20CheckCircleOutline,
  Icon20CopyOutline,
  Icon20EditOutline,
  Icon20PinOutline,
  Icon20PinSlashOutline,
  Icon20ReplyOutline,
  Icon20TrashOutline
} from 'assets/icons'

type LoadingAction = 'pin'

type Props = {
  convo: Convo.Convo
  message: Message.Message
}

export const MessageActionMenu = defineComponent<Props>((props, { slots }) => {
  const { api, lang } = useServices()
  const viewer = useViewerStore()
  const session = useConvoSession()
  const { convoDrafts } = useConvosStore()
  const deleteModal = useModal()
  const pinModal = useModal()
  const errorModal = useModal()
  const loadingAction = shallowRef<LoadingAction>()

  const makeAction = (key: LoadingAction, action: () => Promise<void>) => {
    return async () => {
      if (loadingAction.value) {
        return
      }

      loadingAction.value = key
      try {
        await action()
      } catch (error) {
        console.error('[MessageActionMenu] Action failed', error)
        errorModal.open()
      }
      loadingAction.value = undefined
    }
  }

  const pin = makeAction('pin', async () => {
    const { convo, message } = props
    if (message.kind !== 'Normal' || !Convo.canPinMessage(convo)) {
      return
    }

    await api.fetch('messages.pin', {
      peer_id: message.peerId,
      conversation_message_id: message.cmid
    }).finally(() => pinModal.close())
  })

  const unpin = makeAction('pin', async () => {
    const { convo, message } = props
    if (message.kind !== 'Normal' || !Convo.canPinMessage(convo)) {
      return
    }

    await api.fetch('messages.unpin', { peer_id: message.peerId })
  })

  const getMenuContent = () => {
    const { message, convo } = props

    if (message.kind === 'Normal') {
      const isPinned = convo.kind === 'ChatConvo' && convo.pinnedMessage?.cmid === message.cmid
      const draft = ConvoDraft.safeGet(convoDrafts, convo.id)

      return (
        <ActionMenu>
          {message.isOut &&
            !Message.isUnread(message, convo) &&
            convo.kind === 'ChatConvo' &&
            convo.status === 'in' && (
            <MessageReadersMenuItem convo={convo} message={message} />
          )}
          {convo.canWrite.allowed && (
            <ActionMenuItem
              icon={<Icon20ReplyOutline />}
              text={lang.use('me_message_menu_reply')}
              onClick={() => {
                draft.replyMessage = Message.toForeign(message)
                ConvoDraft.touch(draft)
              }}
              disabled={!!draft.editing}
            />
          )}
          {Convo.canEditMessage(convo, message, viewer.id) && (
            <ActionMenuItem
              icon={<Icon20EditOutline />}
              text={lang.use('me_message_menu_edit')}
              onClick={() => ConvoDraft.startEditing(draft, message)}
              disabled={!!draft.editing}
            />
          )}
          {!!message.text && (
            <ActionMenuItem
              icon={<Icon20CopyOutline />}
              text={lang.use('me_message_menu_copy')}
              onClick={() => navigator.clipboard.writeText(message.text)}
            />
          )}
          {Convo.canPinMessage(convo) && (
            <ActionMenuItem
              icon={isPinned ? <Icon20PinSlashOutline /> : <Icon20PinOutline />}
              text={lang.use(isPinned ? 'me_message_menu_unpin' : 'me_message_menu_pin')}
              disabled={loadingAction.value !== undefined}
              loading={loadingAction.value === 'pin'}
              onClick={isPinned ? unpin : pinModal.open}
            />
          )}
          <ActionMenuItem
            icon={<Icon20CopyOutline />}
            text={lang.use('me_message_menu_copy_cmid')}
            onClick={() => navigator.clipboard.writeText(String(message.cmid))}
          />
          <ActionMenuItem
            icon={<Icon20CheckCircleOutline />}
            text={lang.use('me_message_menu_select')}
            onClick={() => session.selectedCmids.add(message.cmid)}
          />
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={<Icon20TrashOutline />}
            text={lang.use('me_message_menu_delete')}
            mode="destructive"
            disabled={loadingAction.value !== undefined}
            onClick={deleteModal.open}
          />
        </ActionMenu>
      )
    }

    if (message.kind === 'Service' || message.kind === 'Expired') {
      return (
        <ActionMenu>
          <ActionMenuItem
            icon={<Icon20TrashOutline />}
            text={lang.use('me_message_menu_delete')}
            mode="destructive"
            disabled={loadingAction.value !== undefined}
            onClick={deleteModal.open}
          />
        </ActionMenu>
      )
    }

    if (message.kind === 'Pending' && message.isFailed) {
      const failedCount = convo.pendingMessages
        .filter((pending) => pending.isFailed)
        .length

      return (
        <ActionMenu>
          <ActionMenuItem
            icon={<Icon20ArrowUturnLeftOutline />}
            text={lang.use('me_message_menu_retry')}
            onClick={() => retryPendingMessage(convo, message)}
          />
          {failedCount > 1 && (
            <ActionMenuItem
              icon={<Icon20ArrowUturnLeftOutline />}
              text={lang.use('me_message_menu_retry_all', { count: failedCount })}
              onClick={() => retryAllPendingMessages(convo)}
            />
          )}
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={<Icon20TrashOutline />}
            text={lang.use('me_message_menu_delete')}
            mode="destructive"
            onClick={() => Convo.removePendingMessage(convo, message.randomId)}
          />
        </ActionMenu>
      )
    }

    return null
  }

  return () => {
    const content = getMenuContent()
    if (!content) {
      return slots.default?.()
    }

    const { message, convo } = props

    return (
      <>
        <Popper trigger="contextmenu" closeOnContentClick content={content} disabled={session.selectedCmids.size > 0}>
          {slots.default?.()}
        </Popper>

        {message.kind !== 'Pending' && (
          <DeleteMessageModal
            opened={deleteModal.opened}
            onClose={deleteModal.close}
            convo={convo}
            message={message}
          />
        )}

        <Modal
          opened={pinModal.opened}
          onClose={pinModal.close}
          title={lang.use('me_message_menu_pin_confirm_title')}
          buttons={[
            <Button mode="secondary" onClick={pinModal.close}>
              {lang.use('modal_cancel_label')}
            </Button>,
            <Button
              disabled={loadingAction.value !== undefined}
              loading={loadingAction.value === 'pin'}
              onClick={pin}
            >
              {lang.use('me_message_menu_pin')}
            </Button>
          ]}
        >
          {lang.use('me_message_menu_pin_confirm_text')}
        </Modal>

        <Modal
          opened={errorModal.opened}
          onClose={errorModal.close}
          title={lang.use('me_action_menu_error_title')}
          buttons={<Button onClick={errorModal.close}>{lang.use('modal_close_label')}</Button>}
        >
          {lang.use('me_action_menu_error_text')}
        </Modal>
      </>
    )
  }
}, {
  props: ['convo', 'message']
})
