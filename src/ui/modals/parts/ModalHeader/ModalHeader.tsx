import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24Cancel } from 'assets/icons'
import './ModalHeader.css'

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
        <ButtonIcon
          icon={<Icon24Cancel color="var(--vkui--color_icon_medium)" />}
          withHoverBackground
        />
      </div>
    </div>
  )
}, {
  props: ['title', 'onClose']
})
