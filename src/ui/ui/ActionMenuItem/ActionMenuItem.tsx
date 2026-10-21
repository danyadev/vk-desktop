import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ActionMenuItem.css'

export type ActionMenuItemProps = {
  icon?: JSXElement
  after?: JSXElement
  text: string
  mode?: 'default' | 'accent' | 'destructive'
  loading?: boolean
  disabled?: boolean
} & ButtonHTMLAttributes

export const ActionMenuItem = defineComponent<ActionMenuItemProps>((props) => {
  return () => (
    <button
      class={['ActionMenuItem', {
        'ActionMenuItem--accent': props.mode === 'accent',
        'ActionMenuItem--destructive': props.mode === 'destructive'
      }]}
      type="button"
      disabled={!!props.disabled || props.loading}
    >
      {(props.icon || props.loading) && (
        <span class="ActionMenuItem__icon">
          {props.loading ? <Spinner /> : props.icon}
        </span>
      )}
      <span class="ActionMenuItem__text">{props.text}</span>
      {props.after && <span class="ActionMenuItem__after">{props.after}</span>}
    </button>
  )
}, {
  props: ['icon', 'after', 'text', 'mode', 'loading', 'disabled']
})
