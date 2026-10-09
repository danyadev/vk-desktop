import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { useViewerStore } from 'store/viewer'
import { insertConvos } from 'actions'
import { useConvoSession } from 'hooks'
import { PEER_FIELDS } from 'misc/constants'
import { Modal } from 'ui/modals/parts'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
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
import './ConvoHeaderMenu.css'

type Props = { convo: Convo.Convo }
type Confirmation = 'clear' | 'leave'

// VK marks pinned conversations using the three pin bits of majorSortId.
const PIN_FLAGS = (1 << 4) | (1 << 5) | (1 << 6)

export const ConvoHeaderMenu = defineComponent<Props>((props) => {
  const { api, lang } = useServices()
  const { lists } = useConvosStore()
  const session = useConvoSession()
  const viewer = useViewerStore()
  const loading = shallowRef(false)
  const confirmation = shallowRef<Confirmation>()
  const hasError = shallowRef(false)

  const run = async (action: () => Promise<unknown>) => {
    if (loading.value) return
    loading.value = true
    try {
      await action()
    } catch (error) {
      console.error('[ConvoHeaderMenu] Action failed', error)
      hasError.value = true
    } finally {
      loading.value = false
    }
  }

  const goToFirstMessage = () => {
    session.navigationRequest = { kind: 'FirstMessage' }
  }

  const togglePinnedMessage = () => {
    const pinned = props.convo.kind === 'ChatConvo' && props.convo.pinnedMessage
    if (pinned) {
      session.hiddenPinnedCmid =
        session.hiddenPinnedCmid === pinned.cmid ? undefined : pinned.cmid
    }
  }

  const markUnread = () => run(async () => {
    await api.fetch('messages.markAsUnreadConversation', { peer_id: props.convo.id })
    props.convo.isMarkedUnread = true
    Lists.refresh(lists, props.convo)
  })

  const toggleArchive = () => run(async () => {
    const archive = !props.convo.isArchived
    await api.fetch(
      archive ? 'messages.archiveConversation' : 'messages.unarchiveConversation',
      { peer_id: props.convo.id }
    )
    props.convo.isArchived = archive
    Lists.refresh(lists, props.convo)
  })

  const togglePin = () => run(async () => {
    const pinned = (props.convo.majorSortId & PIN_FLAGS) !== 0
    await api.fetch(
      pinned ? 'messages.unpinConversation' : 'messages.pinConversation',
      { peer_id: props.convo.id }
    )

    // Major sort-id changes aren't handled by our engine updates yet.
    // Fetch the actual position; don't try to compute it locally.
    const { items, last_messages: lastMessages = [] } = await api.fetch('messages.getConversationsById', {
      peer_ids: props.convo.id,
      with_last_messages: 1,
      extended: 1,
      fields: PEER_FIELDS
    })
    if (items[0]) {
      insertConvos([{ conversation: items[0], last_message: lastMessages[0] }])
      Lists.refresh(lists, props.convo)
    }
  })

  const toggleNotifications = () => run(async () => {
    const { enabled } = props.convo.notifications
    await api.fetch('account.setSilenceMode', {
      peer_id: props.convo.id,
      sound: enabled ? 0 : 1,
      time: enabled ? -1 : 0
    })
    props.convo.notifications.enabled = !enabled
  })

  const copyId = () => run(() => navigator.clipboard.writeText(String(props.convo.id)))

  const clearHistory = () => run(async () => {
    await api.fetch('messages.deleteConversation', { peer_id: props.convo.id })
    confirmation.value = undefined
    props.convo.history.length = 0
    props.convo.unreadCount = 0
    props.convo.isMarkedUnread = false
    session.anchorCmid = 0
    session.navigationRequest = undefined
    session.viewportPosition = undefined
    Lists.refresh(lists, props.convo)
  })

  const changeChatMembership = (leave: boolean) => run(async () => {
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
    const pinnedMessageHidden = !!pinnedMessage && session.hiddenPinnedCmid === pinnedMessage.cmid
    const { majorSortId } = convo
    const pinned = (majorSortId & PIN_FLAGS) !== 0
    const canPin = !convo.isArchived && !Convo.isHidden(convo) && !Convo.isCasper(convo)
    const isChatMember = convo.kind === 'ChatConvo' && convo.status === 'in'
    const isFormerChatMember = convo.kind === 'ChatConvo' && convo.status === 'left'
    const muted = !convo.notifications.enabled
    const confirmTitle = confirmation.value === 'clear'
      ? lang.use('me_convo_header_menu_clear_confirm_title')
      : lang.use('me_convo_header_menu_leave_confirm_title')
    const confirmText = confirmation.value === 'clear'
      ? lang.use('me_convo_header_menu_clear_confirm_text')
      : lang.use('me_convo_header_menu_leave_confirm_text')
    const confirmButton = confirmation.value === 'clear'
      ? lang.use('me_convo_header_menu_clear')
      : lang.use('me_convo_header_menu_leave')

    return (
      <>
        <Popper
          closeOnContentClick
          content={
            <ActionMenu>
              {!Convo.isHidden(convo) && (
                <ActionMenuItem
                  icon={<Icon20ArrowUpOutline />}
                  text={lang.use('me_convo_header_menu_first')}
                  disabled={loading.value}
                  onClick={goToFirstMessage}
                />
              )}
              {pinnedMessage && (
                <ActionMenuItem
                  icon={pinnedMessageHidden ? <Icon20ViewOutline /> : <Icon20HideOutline />}
                  text={lang.use(pinnedMessageHidden
                    ? 'me_convo_header_menu_show_pinned'
                    : 'me_convo_header_menu_hide_pinned')}
                  onClick={togglePinnedMessage}
                />
              )}
              {!Convo.isUnread(convo) && (
                <ActionMenuItem
                  icon={<Icon20MessageUnreadTopOutline />}
                  text={lang.use('me_convo_header_menu_mark_unread')}
                  disabled={loading.value}
                  onClick={markUnread}
                />
              )}
              {!Convo.isHidden(convo) && (
                <ActionMenuItem
                  icon={convo.isArchived ? <Icon20UnarchiveOutline /> : <Icon20ArchiveOutline />}
                  text={lang.use(convo.isArchived
                    ? 'me_convo_header_menu_unarchive'
                    : 'me_convo_header_menu_archive')}
                  disabled={loading.value}
                  onClick={toggleArchive}
                />
              )}
              {canPin && (
                <ActionMenuItem
                  icon={pinned ? <Icon20PinSlashOutline /> : <Icon20PinOutline />}
                  text={lang.use(pinned
                    ? 'me_convo_header_menu_unpin'
                    : 'me_convo_header_menu_pin')}
                  disabled={loading.value}
                  onClick={togglePin}
                />
              )}
              <ActionMenuItem
                icon={muted ? <Icon20NotificationOutline /> : <Icon20NotificationSlashOutline />}
                text={lang.use(muted
                  ? 'me_convo_header_menu_unmute'
                  : 'me_convo_header_menu_mute')}
                disabled={loading.value}
                onClick={toggleNotifications}
              />
              {isFormerChatMember && (
                <ActionMenuItem
                  icon={<Icon20ArrowUturnLeftOutline />}
                  text={lang.use('me_convo_header_menu_return')}
                  disabled={loading.value}
                  onClick={() => changeChatMembership(false)}
                />
              )}
              <ActionMenuItem
                icon={<Icon20CopyOutline />}
                text={lang.use('me_convo_header_menu_copy_id')}
                disabled={loading.value}
                onClick={copyId}
              />
              {(!Convo.isHidden(convo) || isChatMember) && (
                <div class="ConvoHeaderMenu__separator" />
              )}
              {!Convo.isHidden(convo) && (
                <ActionMenuItem
                  mode="destructive"
                  icon={<Icon20ClearDataOutline />}
                  text={lang.use('me_convo_header_menu_clear')}
                  disabled={loading.value}
                  onClick={() => (confirmation.value = 'clear')}
                />
              )}
              {isChatMember && (
                <ActionMenuItem
                  mode="destructive"
                  icon={<Icon20DoorArrowRightOutline />}
                  text={lang.use('me_convo_header_menu_leave')}
                  disabled={loading.value}
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
            aria-label={lang.use('me_convo_header_menu_actions')}
          />
        </Popper>

        <Modal
          opened={!!confirmation.value}
          onClose={() => (confirmation.value = undefined)}
          title={confirmTitle}
          buttons={[
            <Button mode="secondary" onClick={() => (confirmation.value = undefined)}>
              {lang.use('modal_cancel_label')}
            </Button>,
            <Button
              mode="destructive"
              loading={loading.value}
              disabled={loading.value}
              onClick={confirmation.value === 'clear'
                ? clearHistory
                : () => changeChatMembership(true)}
            >
              {confirmButton}
            </Button>
          ]}
        >
          {confirmText}
        </Modal>

        <Modal
          opened={hasError.value}
          onClose={() => (hasError.value = false)}
          title={lang.use('me_convo_header_menu_error_title')}
          buttons={
            <Button onClick={() => (hasError.value = false)}>
              {lang.use('modal_close_label')}
            </Button>
          }
        >
          {lang.use('me_convo_header_menu_error_text')}
        </Modal>
      </>
    )
  }
}, {
  props: ['convo']
})
