import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'
import { useConvoSession, useKeyboardZones, useModal } from 'hooks'
import { isEventWithModifier, isNonEmptyArray, NonEmptyArray } from 'misc/utils'
import { DeleteMessageModal } from 'ui/messenger/DeleteMessageModal/DeleteMessageModal'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon20MessageArrowRightOutline, Icon20TrashOutline, Icon24Cancel } from 'assets/icons'
import './ConvoSelectionToolbar.css'

type Props = {
  convo: Convo.Convo
  selectedMessages: NonEmptyArray<Message.Confirmed> | null
}

export const ConvoSelectionToolbar = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const session = useConvoSession()
  const { convoDrafts } = useConvosStore()
  const { registerZoneHandler } = useKeyboardZones()
  const deleteModal = useModal()
  const draft = ConvoDraft.safeGet(convoDrafts, props.convo.id)

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

    draft.forwardedMessages = messages
    draft.replyMessage = undefined
    ConvoDraft.touch(draft)

    session.selectedCmids.clear()
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

      <ButtonIcon
        class="ConvoSelectionToolbar__forward"
        icon={<Icon20MessageArrowRightOutline />}
        title={lang.use('me_message_menu_forward')}
        withHoverBackground
        disabled={
          !props.convo.canWrite.allowed ||
          Convo.isChannel(props.convo) ||
          !props.selectedMessages?.every((message) => message.kind === 'Normal')
        }
        onClick={forwardMessages}
      />
      <ButtonIcon
        class="ConvoSelectionToolbar__delete"
        icon={<Icon20TrashOutline />}
        title={lang.use('me_message_menu_delete')}
        withHoverBackground
        disabled={!props.selectedMessages}
        onClick={deleteModal.open}
      />

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
