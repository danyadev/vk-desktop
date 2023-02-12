import './ModalHeader.css'
import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import { Icon24Cancel } from 'assets/icons'

type Props = {
  /** Заголовок модалки */
  title: string | JSXElement
  /** Обработчик закрытия при клике на крестик */
  onClose: () => void
}

export const ModalHeader = defineComponent<Props>((props) => {
  return () => (
    <div class="ModalHeader">
      {props.title}
      <div class="ModalHeader__closeIcon" onClick={props.onClose}>
        <Icon24Cancel />
      </div>
    </div>
  )
})

ModalHeader.props = ['title', 'onClose']
