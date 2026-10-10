import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { useViewerStore } from 'store/viewer'
import { useConvoSession } from 'hooks'
import { Modal } from 'ui/modals/parts'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ActionMenuSeparator } from 'ui/ui/ActionMenuSeparator/ActionMenuSeparator'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Popper } from 'ui/ui/Popper/Popper'
import {
  Icon20ArchiveOutline,
  Icon20ArrowUpOutline,
  Icon20ArrowUturnLeftOutline,
  Icon20ClearDataOutline,
  Icon20CopyOutline,
  Icon20DoorArrowRightOutline,
  Icon20HideOutline,
  Icon20MessageUnreadTopOutline,
  Icon20NotificationOutline,
  Icon20NotificationSlashOutline,
  Icon20PinOutline,
  Icon20PinSlashOutline,
  Icon20UnarchiveOutline,
  Icon20ViewOutline,
  Icon24MoreHorizontal
} from 'assets/icons'

type Props = {
  convo: Convo.Convo
}
type Confirmation = 'clear' | 'leave'
type LoadingAction =
  | 'markUnread'
  | 'archive'
  | 'pin'
  | 'mute'
  | 'copyId'
  | 'clear'
  | 'membership'

export const ConvoHeaderMenu = defineComponent<Props>((props) => {
  const { api, lang } = useServices()
  const { lists, hiddenPinnedMessages } = useConvosStore()
  const session = useConvoSession()
  const viewer = useViewerStore()
  const loadingAction = shallowRef<LoadingAction>()
  const confirmation = shallowRef<Confirmation>()
  const hasError = shallowRef(false)

  const run = async (key: LoadingAction, action: () => Promise<unknown>) => {
    if (loadingAction.value) {
      return
    }

    loadingAction.value = key
    try {
      await action()
    } catch (error) {
      console.error('[ConvoHeaderMenu] Action failed', error)
      hasError.value = true
    } finally {
      loadingAction.value = undefined
    }
  }

  const goToFirstMessage = () => {
    session.navigationRequest = {
      kind: 'Message',
      cmid: Message.resolveCmid(1),
      allowNearby: true,
      highlight: false
    }
  }

  const togglePinnedMessage = () => {
    const pinned = props.convo.kind === 'ChatConvo' && props.convo.pinnedMessage
    if (pinned) {
      if (hiddenPinnedMessages.get(props.convo.id) === pinned.cmid) {
        hiddenPinnedMessages.delete(props.convo.id)
      } else {
        hiddenPinnedMessages.set(props.convo.id, pinned.cmid)
      }
    }
  }

  const markUnread = () => run('markUnread', async () => {
    await api.fetch('messages.markAsUnreadConversation', { peer_id: props.convo.id })
    props.convo.isMarkedUnread = true
    Lists.refresh(lists, props.convo)
  })

  const toggleArchive = () => run('archive', async () => {
    const archive = !props.convo.isArchived
    await api.fetch(
      archive ? 'messages.archiveConversation' : 'messages.unarchiveConversation',
      { peer_id: props.convo.id }
    )
    props.convo.isArchived = archive
    Lists.refresh(lists, props.convo)
  })

  const togglePin = () => run('pin', async () => {
    await api.fetch(
      props.convo.majorSortId
        ? 'messages.unpinConversation'
        : 'messages.pinConversation',
      { peer_id: props.convo.id }
    )
  })

  const toggleNotifications = () => run('mute', async () => {
    const { enabled } = props.convo.notifications
    await api.fetch('account.setSilenceMode', {
      peer_id: props.convo.id,
      sound: enabled ? 0 : 1,
      time: enabled ? -1 : 0
    })
    props.convo.notifications.enabled = !enabled
  })

  const copyId = () => run('copyId', () => navigator.clipboard.writeText(String(props.convo.id)))

  const clearHistory = () => run('clear', async () => {
    await api.fetch('messages.deleteConversation', { peer_id: props.convo.id })
    confirmation.value = undefined
  })

  const changeChatMembership = (leave: boolean) => run('membership', async () => {
    if (props.convo.kind !== 'ChatConvo') return
    const params = {
      chat_id: Peer.toRealId(props.convo.id),
      user_id: viewer.id
    }
    if (leave) {
      await api.fetch('messages.removeChatUser', params)
    } else {
      await api.fetch('messages.addChatUser', params)
    }
    props.convo.status = leave ? 'left' : 'in'
    confirmation.value = undefined
  })

  return () => {
    const { convo } = props
    const pinnedMessage = convo.kind === 'ChatConvo' && convo.pinnedMessage
    const pinnedMessageHidden = !!pinnedMessage && hiddenPinnedMessages.get(convo.id) === pinnedMessage.cmid
    const pinned = convo.majorSortId !== 0
    const canPin = !convo.isArchived && !Convo.isHidden(convo) && !Convo.isCasper(convo)
    const isChatMember = convo.kind === 'ChatConvo' && convo.status === 'in'
    const muted = !convo.notifications.enabled
    const disabled = loadingAction.value !== undefined

    return (
      <>
        <Popper
          closeOnContentClick
          content={
            <ActionMenu>
              {!Convo.isHidden(convo) && (
                <ActionMenuItem
                  icon={<Icon20ArrowUpOutline />}
                  text={lang.use('me_convo_menu_first')}
                  disabled={disabled}
                  onClick={goToFirstMessage}
                />
              )}
              {pinnedMessage && (
                <ActionMenuItem
                  icon={pinnedMessageHidden ? <Icon20ViewOutline /> : <Icon20HideOutline />}
                  text={lang.use(pinnedMessageHidden ? 'me_convo_menu_show_pinned' : 'me_convo_menu_hide_pinned')}
                  disabled={disabled}
                  onClick={togglePinnedMessage}
                />
              )}
              {!Convo.isUnread(convo) && (
                <ActionMenuItem
                  icon={<Icon20MessageUnreadTopOutline />}
                  text={lang.use('me_convo_menu_mark_unread')}
                  disabled={disabled}
                  loading={loadingAction.value === 'markUnread'}
                  onClick={markUnread}
                />
              )}
              {!Convo.isHidden(convo) && (
                <ActionMenuItem
                  icon={convo.isArchived ? <Icon20UnarchiveOutline /> : <Icon20ArchiveOutline />}
                  text={lang.use(convo.isArchived ? 'me_convo_menu_unarchive' : 'me_convo_menu_archive')}
                  disabled={disabled}
                  loading={loadingAction.value === 'archive'}
                  onClick={toggleArchive}
                />
              )}
              {canPin && (
                <ActionMenuItem
                  icon={pinned ? <Icon20PinSlashOutline /> : <Icon20PinOutline />}
                  text={lang.use(pinned ? 'me_convo_menu_unpin' : 'me_convo_menu_pin')}
                  disabled={disabled}
                  loading={loadingAction.value === 'pin'}
                  onClick={togglePin}
                />
              )}
              <ActionMenuItem
                icon={muted ? <Icon20NotificationOutline /> : <Icon20NotificationSlashOutline />}
                text={lang.use(muted ? 'me_convo_menu_unmute' : 'me_convo_menu_mute')}
                disabled={disabled}
                loading={loadingAction.value === 'mute'}
                onClick={toggleNotifications}
              />
              {convo.kind === 'ChatConvo' && convo.status === 'left' && (
                <ActionMenuItem
                  icon={<Icon20ArrowUturnLeftOutline />}
                  text={lang.use('me_convo_menu_return')}
                  disabled={disabled}
                  loading={loadingAction.value === 'membership'}
                  onClick={() => changeChatMembership(false)}
                />
              )}
              <ActionMenuItem
                icon={<Icon20CopyOutline />}
                text={lang.use('me_convo_menu_copy_id')}
                disabled={disabled}
                loading={loadingAction.value === 'copyId'}
                onClick={copyId}
              />
              {(!Convo.isHidden(convo) || isChatMember) && (
                <ActionMenuSeparator />
              )}
              {!Convo.isHidden(convo) && (
                <ActionMenuItem
                  mode="destructive"
                  icon={<Icon20ClearDataOutline />}
                  text={lang.use('me_convo_menu_clear')}
                  disabled={disabled}
                  onClick={() => (confirmation.value = 'clear')}
                />
              )}
              {isChatMember && (
                <ActionMenuItem
                  mode="destructive"
                  icon={<Icon20DoorArrowRightOutline />}
                  text={lang.use('me_convo_menu_leave')}
                  disabled={disabled}
                  onClick={() => (confirmation.value = 'leave')}
                />
              )}
            </ActionMenu>
          }
        >
          <ButtonIcon
            class="ConvoHeader__actions"
            icon={<Icon24MoreHorizontal color="var(--vkui--color_icon_secondary)" />}
            withHoverBackground
            shiftOnClick
            aria-label={lang.use('me_convo_menu_actions')}
          />
        </Popper>

        <Modal
          opened={!!confirmation.value}
          onClose={() => (confirmation.value = undefined)}
          title={lang.use(confirmation.value === 'clear'
            ? 'me_convo_menu_clear_confirm_title'
            : 'me_convo_menu_leave_confirm_title')}
          buttons={[
            <Button mode="secondary" onClick={() => (confirmation.value = undefined)}>
              {lang.use('modal_cancel_label')}
            </Button>,
            <Button
              mode="destructive"
              loading={loadingAction.value === (confirmation.value === 'clear' ? 'clear' : 'membership')}
              disabled={disabled}
              onClick={confirmation.value === 'clear'
                ? clearHistory
                : () => changeChatMembership(true)}
            >
              {lang.use(confirmation.value === 'clear'
                ? 'me_convo_menu_clear'
                : 'me_convo_menu_leave')}
            </Button>
          ]}
        >
          {lang.use(confirmation.value === 'clear'
            ? 'me_convo_menu_clear_confirm_text'
            : 'me_convo_menu_leave_confirm_text')}
        </Modal>

        <Modal
          opened={hasError.value}
          onClose={() => (hasError.value = false)}
          title={lang.use('me_convo_menu_error_title')}
          buttons={
            <Button onClick={() => (hasError.value = false)}>
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
  props: ['convo']
})
