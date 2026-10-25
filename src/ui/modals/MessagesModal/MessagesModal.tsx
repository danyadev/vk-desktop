import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Message from 'model/Message'
import { createConvoSession } from 'store/convos'
import { provideConvoSession, useGlobalModal } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { HistoryMessages } from 'ui/messenger/ConvoHistory/HistoryMessages'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import './MessagesModal.css'

export type MessagesModalProps = {
  messages: NonEmptyArray<Message.Message | Message.Foreign>
}

export const MessagesModal = defineComponent<MessagesModalProps>((props) => {
  const { lang } = useServices()
  const { messagesModal } = useGlobalModal()
  provideConvoSession(createConvoSession())

  return () => (
    <Modal
      opened={messagesModal.opened}
      onClose={messagesModal.close}
      onVisibilityChange={messagesModal.onVisibilityChange}
      title={props.messages.length > 1
        ? lang.usePlural('me_messages', props.messages.length)
        : lang.use('messagePreviewModal_title')}
      buttons={
        <Button onClick={messagesModal.close}>
          {lang.use('modal_close_label')}
        </Button>
      }
      class="MessagesModal"
    >
      <HistoryMessages
        messages={props.messages}
        hasMessagesAbove={false}
      />
    </Modal>
  )
}, { props: ['messages'] })
