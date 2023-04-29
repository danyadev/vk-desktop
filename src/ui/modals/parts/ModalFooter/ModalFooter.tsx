import './ModalFooter.css'

import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'

type Props = {
  /** Кнопки, зафиксированные справа. Сначала кнопка отмены, затем кнопка действия */
  buttons: JSXElement | JSXElement[]
  /** Контент в левой части футера */
  leftContent?: JSXElement
}

export const ModalFooter = defineComponent<Props>((props) => {
  return () => (
    <div class="ModalFooter">
      {props.leftContent}
      <div class="ModalFooter__buttons">{props.buttons}</div>
    </div>
  )
})

ModalFooter.props = ['buttons', 'leftContent']
