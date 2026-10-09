import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import './ActionMenuItem.css'

type Props = {
  icon?: JSXElement
  text: string
  mode?: 'default' | 'accent' | 'destructive'
} & ButtonHTMLAttributes

export const ActionMenuItem = defineComponent<Props>((props) => {
  return () => (
    <button
      class={['ActionMenuItem', {
        'ActionMenuItem--accent': props.mode === 'accent',
        'ActionMenuItem--destructive': props.mode === 'destructive'
      }]}
      type="button"
    >
      {props.icon && <span class="ActionMenuItem__icon">{props.icon}</span>}
      <span class="ActionMenuItem__text">{props.text}</span>
    </button>
  )
}, {
  props: ['icon', 'text', 'mode']
})
