import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import './ActionMenuItem.css'

type Props = {
  icon?: JSXElement
  text: string
} & ButtonHTMLAttributes

export const ActionMenuItem = defineComponent<Props>((props) => {
  return () => (
    <button class="ActionMenuItem" type="button">
      {props.icon && <span>{props.icon}</span>}
      <span>{props.text}</span>
    </button>
  )
}, {
  props: ['icon', 'text']
})
