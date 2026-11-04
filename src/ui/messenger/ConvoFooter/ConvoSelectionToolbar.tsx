import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { useConvoSession, useKeyboardZones, useModal } from 'hooks'
import { isEventWithModifier, isNonEmptyArray, NonEmptyArray } from 'misc/utils'
import { DeleteMessageModal } from 'ui/messenger/DeleteMessageModal/DeleteMessageModal'
import { ForwardMessageModal } from 'ui/modals/ForwardMessageModal/ForwardMessageModal'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon20ShareOutline, Icon20TrashOutline, Icon24Cancel } from 'assets/icons'
import './ConvoSelectionToolbar.css'

type Props = {
  convo: Convo.Convo
  selectedMessages: NonEmptyArray<Message.Confirmed> | null
}

export const ConvoSelectionToolbar = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const session = useConvoSession()
  const { registerZoneHandler } = useKeyboardZones()
  const deleteModal = useModal()
  const forwardModal = useModal()
  const forwardingMessages = shallowRef<NonEmptyArray<Message.Foreign>>()

  registerZoneHandler('convoView', (event) => {
    if (event.key === 'Escape' && !isEventWithModifier(event)) {
      session.selectedCmids.clear()
      return true
    }
  })

  const forwardMessages = () => {
    if (!props.selectedMessages) return

    const messages = props.selectedMessages
      .filter((message): message is Message.Normal => message.kind === 'Normal')
      .sort((a, b) => a.cmid - b.cmid)
      .map(Message.toForeign)

    if (!isNonEmptyArray(messages) || messages.length !== props.selectedMessages.length) return

    forwardingMessages.value = messages
    forwardModal.open()
  }

  return () => (
    <div class="ConvoSelectionToolbar">
      <ButtonIcon
        class="ConvoSelectionToolbar__cancel"
        icon={<Icon24Cancel />}
        withHoverBackground
        onClick={() => session.selectedCmids.clear()}
      />
      <span>
        {lang.usePlural('me_messages_count', session.selectedCmids.size)}
      </span>

      <Button
        class="ConvoSelectionToolbar__forward"
        size="small"
        mode="tertiary"
        before={<Icon20ShareOutline color="var(--vkui--color_icon_secondary)" />}
        disabled={!props.selectedMessages?.every((message) => message.kind === 'Normal')}
        onClick={forwardMessages}
      >
        {lang.use('me_message_menu_forward')}
      </Button>
      <ButtonIcon
        class="ConvoSelectionToolbar__delete"
        icon={<Icon20TrashOutline />}
        title={lang.use('me_message_menu_delete')}
        withHoverBackground
        disabled={!props.selectedMessages}
        onClick={deleteModal.open}
      />

      {forwardingMessages.value && (
        <ForwardMessageModal
          opened={forwardModal.opened}
          onClose={forwardModal.close}
          onSelect={() => session.selectedCmids.clear()}
          messages={forwardingMessages.value}
        />
      )}

      {props.selectedMessages && (
        <DeleteMessageModal
          convo={props.convo}
          messages={props.selectedMessages}
          opened={deleteModal.opened}
          onClose={deleteModal.close}
          onDeleted={(cmids) => {
            cmids.forEach((cmid) => session.selectedCmids.delete(cmid))
          }}
        />
      )}
    </div>
  )
}, {
  props: ['convo', 'selectedMessages']
})
