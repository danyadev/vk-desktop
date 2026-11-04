import { defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import { ConvoPicker } from 'ui/messenger/ConvoPicker/ConvoPicker'
import { Modal } from 'ui/modals/parts'
import './ConvoSelectModal.css'

type Props = {
  opened: boolean
  onClose: () => void
  title: string
  onSelect: (convo: Convo.Convo) => void
  getDisabledReason?: (convo: Convo.Convo) => string | undefined
}

export const ConvoSelectModal = defineComponent<Props>((props) => {
  return () => (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      title={props.title}
      class="ConvoSelectModal"
      withoutBodyPadding
    >
      <ConvoPicker onSelect={props.onSelect} getDisabledReason={props.getDisabledReason} />
    </Modal>
  )
}, {
  props: ['opened', 'onClose', 'title', 'onSelect', 'getDisabledReason']
})
