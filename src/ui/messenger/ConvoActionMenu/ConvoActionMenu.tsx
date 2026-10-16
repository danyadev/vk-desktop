import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { useViewerStore } from 'store/viewer'
import { toggleConvoNotifications } from 'actions'
import { useConvoSession, useModal } from 'hooks'
import { Modal } from 'ui/modals/parts'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ActionMenuSeparator } from 'ui/ui/ActionMenuSeparator/ActionMenuSeparator'
import { Button } from 'ui/ui/Button/Button'
import { Popper } from 'ui/ui/Popper/Popper'
import {
  Icon20ArchiveOutline,
  Icon20ArrowUpOutline,
  Icon20ArrowUturnLeftOutline,
  Icon20ClearDataOutline,
  Icon20CopyOutline,
  Icon20DoorArrowRightOutline,
  Icon20HideOutline,
  Icon20MessageCheckOutline,
  Icon20MessageUnreadTopOutline,
  Icon20NotificationOutline,
  Icon20NotificationSlashOutline,
  Icon20PinOutline,
  Icon20PinSlashOutline,
  Icon20UnarchiveOutline,
  Icon20ViewOutline
} from 'assets/icons'

type LoadingAction =
  | 'read'
  | 'archive'
  | 'pin'
  | 'mute'
  | 'clear'
  | 'membership'

type Props = {
  convo: Convo.Convo
  fromConvoList?: boolean
}

export const ConvoActionMenu = defineComponent<Props>((props, { slots }) => {
  const { api, lang } = useServices()
  const { hiddenPinnedMessages } = useConvosStore()
  const session = props.fromConvoList ? undefined : useConvoSession()
  const viewer = useViewerStore()

  const loadingAction = shallowRef<LoadingAction>()
  const clearHistoryModal = useModal()
  const leaveChatModal = useModal()
  const errorModal = useModal()

  const makeAction = (key: LoadingAction, action: () => Promise<void>) => {
    return async () => {
      if (loadingAction.value) {
        return
      }

      loadingAction.value = key
      try {
        await action()
      } catch (error) {
        console.error('[ConvoHeaderMenu] Action failed', error)
        errorModal.open()
      }
      loadingAction.value = undefined
    }
  }

  const goToFirstMessage = () => {
    if (!session) return
    session.navigationRequest = {
      kind: 'Message',
      cmid: Message.resolveCmid(1),
      landNearbyIfMissing: true,
      highlight: false
    }
  }

  const togglePinnedMessage = () => {
    const pinnedMessage = props.convo.kind === 'ChatConvo' && props.convo.pinnedMessage
    if (pinnedMessage) {
      if (hiddenPinnedMessages.get(props.convo.id) === pinnedMessage.cmid) {
        hiddenPinnedMessages.delete(props.convo.id)
      } else {
        hiddenPinnedMessages.set(props.convo.id, pinnedMessage.cmid)
      }
    }
  }

  const markRead = makeAction('read', async () => {
    await api.fetch('messages.markAsRead', {
      peer_id: props.convo.id,
      mark_conversation_as_read: 1
    })
  })

  const markUnread = makeAction('read', async () => {
    await api.fetch('messages.markAsUnreadConversation', {
      peer_id: props.convo.id
    })
  })

  const toggleArchive = makeAction('archive', async () => {
    const archive = !props.convo.isArchived
    await api.fetch(
      archive ? 'messages.archiveConversation' : 'messages.unarchiveConversation',
      { peer_id: props.convo.id }
    )
  })

  const togglePin = makeAction('pin', async () => {
    await api.fetch(
      props.convo.majorSortId ? 'messages.unpinConversation' : 'messages.pinConversation',
      { peer_id: props.convo.id }
    )
  })

  const toggleNotifications = makeAction('mute', async () => {
    await toggleConvoNotifications(props.convo)
  })

  const copyId = () => {
    navigator.clipboard.writeText(String(props.convo.id))
  }

  const clearHistory = makeAction('clear', async () => {
    await api.fetch('messages.deleteConversation', { peer_id: props.convo.id })
    clearHistoryModal.close()
  })

  const returnToChat = makeAction('membership', async () => {
    if (props.convo.kind !== 'ChatConvo') return
    await api.fetch('messages.addChatUser', {
      chat_id: Peer.toRealId(props.convo.id),
      user_id: viewer.id
    })
  })

  const leaveChat = makeAction('membership', async () => {
    if (props.convo.kind !== 'ChatConvo') return
    await api.fetch('messages.removeChatUser', {
      chat_id: Peer.toRealId(props.convo.id),
      user_id: viewer.id
    })
    leaveChatModal.close()
  })

  return () => {
    const { convo } = props
    const pinnedMessage = convo.kind === 'ChatConvo' && convo.pinnedMessage
    const pinnedMessageHidden =
      !!pinnedMessage && hiddenPinnedMessages.get(convo.id) === pinnedMessage.cmid
    const pinned = convo.majorSortId !== 0
    const muted = !convo.notifications.enabled
    const disabled = loadingAction.value !== undefined

    return (
      <>
        <Popper
          trigger={props.fromConvoList ? 'contextmenu' : 'click'}
          closeOnContentClick
          content={
            <ActionMenu>
              {convo.kind === 'ChatConvo' && convo.status === 'left' && (
                <ActionMenuItem
                  icon={<Icon20ArrowUturnLeftOutline />}
                  text={lang.use('me_convo_menu_return')}
                  disabled={disabled}
                  loading={loadingAction.value === 'membership'}
                  onClick={returnToChat}
                />
              )}
              <ActionMenuItem
                icon={muted ? <Icon20NotificationOutline /> : <Icon20NotificationSlashOutline />}
                text={lang.use(muted ? 'me_convo_menu_unmute' : 'me_convo_menu_mute')}
                disabled={disabled}
                loading={loadingAction.value === 'mute'}
                onClick={toggleNotifications}
              />
              {Convo.isUnread(convo) ? (
                <ActionMenuItem
                  icon={<Icon20MessageCheckOutline />}
                  text={lang.use('me_convo_menu_mark_read')}
                  disabled={disabled}
                  loading={loadingAction.value === 'read'}
                  onClick={markRead}
                />
              ) : (
                <ActionMenuItem
                  icon={<Icon20MessageUnreadTopOutline />}
                  text={lang.use('me_convo_menu_mark_unread')}
                  disabled={disabled}
                  loading={loadingAction.value === 'read'}
                  onClick={markUnread}
                />
              )}
              <ActionMenuItem
                icon={convo.isArchived ? <Icon20UnarchiveOutline /> : <Icon20ArchiveOutline />}
                text={lang.use(convo.isArchived
                  ? 'me_convo_menu_unarchive'
                  : 'me_convo_menu_archive')}
                disabled={disabled}
                loading={loadingAction.value === 'archive'}
                onClick={toggleArchive}
              />
              {!convo.isArchived && (
                <ActionMenuItem
                  icon={pinned ? <Icon20PinSlashOutline /> : <Icon20PinOutline />}
                  text={lang.use(pinned ? 'me_convo_menu_unpin' : 'me_convo_menu_pin')}
                  disabled={disabled}
                  loading={loadingAction.value === 'pin'}
                  onClick={togglePin}
                />
              )}
              {pinnedMessage && !props.fromConvoList && (
                <ActionMenuItem
                  icon={pinnedMessageHidden ? <Icon20ViewOutline /> : <Icon20HideOutline />}
                  text={lang.use(pinnedMessageHidden
                    ? 'me_convo_menu_show_pinned'
                    : 'me_convo_menu_hide_pinned')}
                  onClick={togglePinnedMessage}
                />
              )}
              {!props.fromConvoList && (
                <ActionMenuItem
                  icon={<Icon20ArrowUpOutline />}
                  text={lang.use('me_convo_menu_first')}
                  onClick={goToFirstMessage}
                />
              )}
              <ActionMenuItem
                icon={<Icon20CopyOutline />}
                text={lang.use('me_convo_menu_copy_id')}
                onClick={copyId}
              />

              <ActionMenuSeparator />

              <ActionMenuItem
                mode="destructive"
                icon={<Icon20ClearDataOutline />}
                text={lang.use('me_convo_menu_clear')}
                disabled={disabled}
                onClick={clearHistoryModal.open}
              />
              {convo.kind === 'ChatConvo' && convo.status === 'in' && (
                <ActionMenuItem
                  mode="destructive"
                  icon={<Icon20DoorArrowRightOutline />}
                  text={lang.use('me_convo_menu_leave')}
                  disabled={disabled}
                  onClick={leaveChatModal.open}
                />
              )}
            </ActionMenu>
          }
        >
          {slots.default?.()}
        </Popper>

        <Modal
          opened={clearHistoryModal.opened}
          onClose={clearHistoryModal.close}
          title={lang.use('me_convo_menu_clear_confirm_title')}
          buttons={[
            <Button mode="secondary" onClick={clearHistoryModal.close}>
              {lang.use('modal_cancel_label')}
            </Button>,
            <Button
              mode="destructive"
              loading={loadingAction.value === 'clear'}
              disabled={disabled}
              onClick={clearHistory}
            >
              {lang.use('me_convo_menu_clear')}
            </Button>
          ]}
        >
          {lang.use('me_convo_menu_clear_confirm_text')}
        </Modal>

        <Modal
          opened={leaveChatModal.opened}
          onClose={leaveChatModal.close}
          title={lang.use('me_convo_menu_leave_confirm_title')}
          buttons={[
            <Button mode="secondary" onClick={leaveChatModal.close}>
              {lang.use('modal_cancel_label')}
            </Button>,
            <Button
              mode="destructive"
              loading={loadingAction.value === 'membership'}
              disabled={disabled}
              onClick={leaveChat}
            >
              {lang.use('me_convo_menu_leave')}
            </Button>
          ]}
        >
          {lang.use('me_convo_menu_leave_confirm_text')}
        </Modal>

        <Modal
          opened={errorModal.opened}
          onClose={errorModal.close}
          title={lang.use('me_convo_menu_error_title')}
          buttons={
            <Button onClick={errorModal.close}>
              {lang.use('modal_close_label')}
            </Button>
          }
        >
          {lang.use('me_convo_menu_error_text')}
        </Modal>
      </>
    )
  }
}, {
  props: ['convo', 'fromConvoList']
})
