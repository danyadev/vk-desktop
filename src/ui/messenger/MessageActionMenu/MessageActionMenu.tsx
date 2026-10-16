import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'
import { retryAllPendingMessages, retryPendingMessage } from 'actions'
import { useModal } from 'hooks'
import { Modal } from 'ui/modals/parts'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ActionMenuSeparator } from 'ui/ui/ActionMenuSeparator/ActionMenuSeparator'
import { Button } from 'ui/ui/Button/Button'
import { Checkbox } from 'ui/ui/Checkbox/Checkbox'
import { Popper } from 'ui/ui/Popper/Popper'
import {
  Icon20ArrowUturnLeftOutline,
  Icon20CopyOutline,
  Icon20PinOutline,
  Icon20PinSlashOutline,
  Icon20ReplyOutline,
  Icon20TrashOutline
} from 'assets/icons'
import './MessageActionMenu.css'

type LoadingAction = 'delete' | 'pin'

type Props = {
  convo: Convo.Convo
  message: Message.Message
}

export const MessageActionMenu = defineComponent<Props>((props, { slots }) => {
  const { api, lang } = useServices()
  const viewer = useViewerStore()
  const settings = useSettingsStore()
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

  const deleteMessage = makeAction('delete', async () => {
    const { convo, message } = props
    if (message.kind === 'Pending') return

    try {
      const canDeleteForAll = Convo.canDeleteMessageForAll(convo, message, viewer.id)
      const results = await api.fetch('messages.delete', {
        peer_id: message.peerId,
        cmids: message.cmid,
        delete_for_all: canDeleteForAll && settings.deleteMessageForAllPreference ? 1 : 0
      })
      const result = results.find((item) => (
        item.conversation_message_id === message.cmid
      ))

      if (result?.response !== 1) {
        const { code, description } = result?.error ?? {}
        throw new Error(`[MessageActionMenu] Message deletion failed: ${description} (${code})`)
      }
    } finally {
      deleteModal.close()
    }
  })

  const openDelete = () => {
    deleteModal.open()
  }

  const getMenuContent = () => {
    const { message, convo } = props

    if (message.kind === 'Normal') {
      const isPinned = convo.kind === 'ChatConvo' && convo.pinnedMessage?.cmid === message.cmid

      return (
        <ActionMenu>
          {convo.canWrite.allowed && !Convo.isChannel(convo) && (
            <ActionMenuItem
              icon={<Icon20ReplyOutline />}
              text={lang.use('me_message_menu_reply')}
              onClick={() => {
                ConvoDraft.safeGet(convoDrafts, convo.id).replyMessage = Message.toForeign(message)
              }}
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
          <ActionMenuSeparator />
          <ActionMenuItem
            icon={<Icon20TrashOutline />}
            text={lang.use('me_message_menu_delete')}
            mode="destructive"
            disabled={loadingAction.value !== undefined}
            loading={loadingAction.value === 'delete'}
            onClick={openDelete}
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
            loading={loadingAction.value === 'delete'}
            onClick={openDelete}
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
    const canDeleteForAll =
      message.kind !== 'Pending' && Convo.canDeleteMessageForAll(convo, message, viewer.id)

    return (
      <>
        <Popper trigger="contextmenu" closeOnContentClick content={content}>
          {slots.default?.()}
        </Popper>

        <Modal
          opened={deleteModal.opened}
          onClose={deleteModal.close}
          title={lang.use('me_message_menu_delete_confirm_title')}
          buttons={[
            <Button mode="secondary" onClick={deleteModal.close}>
              {lang.use('modal_cancel_label')}
            </Button>,
            <Button
              mode="destructive"
              disabled={loadingAction.value !== undefined}
              loading={loadingAction.value === 'delete'}
              onClick={deleteMessage}
            >
              {lang.use('me_message_menu_delete')}
            </Button>
          ]}
          class="MessageActionMenu__deleteModal"
        >
          {lang.use('me_message_menu_delete_confirm_text')}
          {canDeleteForAll && (
            <Checkbox
              label={lang.use('me_message_menu_delete_for_all')}
              checked={settings.deleteMessageForAllPreference}
              onChange={(checked) => (settings.deleteMessageForAllPreference = checked)}
            />
          )}
        </Modal>

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
          title={lang.use('me_convo_menu_error_title')}
          buttons={<Button onClick={errorModal.close}>{lang.use('modal_close_label')}</Button>}
        >
          {lang.use('me_convo_menu_error_text')}
        </Modal>
      </>
    )
  }
}, {
  props: ['convo', 'message']
})
