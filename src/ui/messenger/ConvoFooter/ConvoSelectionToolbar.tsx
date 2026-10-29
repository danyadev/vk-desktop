import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { useConvoSession, useKeyboardZones, useModal } from 'hooks'
import { isEventWithModifier, NonEmptyArray } from 'misc/utils'
import { DeleteMessageModal } from 'ui/messenger/DeleteMessageModal/DeleteMessageModal'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon20TrashOutline, Icon24Cancel } from 'assets/icons'
import './ConvoSelectionToolbar.css'

type Props = {
  convo: Convo.Convo
  selectedMessages: NonEmptyArray<Message.Confirmed> | null
}

export const ConvoSelectionToolbar = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const session = useConvoSession()
  const deleteModal = useModal()
  const { registerZoneHandler } = useKeyboardZones()

  registerZoneHandler('convoView', (event) => {
    if (event.key === 'Escape' && !isEventWithModifier(event)) {
      session.selectedCmids.clear()
      return true
    }
  })

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
