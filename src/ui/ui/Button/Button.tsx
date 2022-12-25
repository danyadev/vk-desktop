import './Button.css'
import { defineComponent, ButtonHTMLAttributes } from 'vue'
import { JSXElement } from 'misc/utils'
import { Spinner } from 'ui/ui/Spinner/Spinner'

type Props = {
  size?: 'small' | 'medium' | 'large'
  mode?: 'primary' | 'secondary' | 'tertiary' | 'outline'
  wide?: boolean
  before?: JSXElement
  after?: JSXElement
  loading?: boolean
} & ButtonHTMLAttributes

export const Button = defineComponent<Props>((props, { slots }) => {
  return () => {
    const { size = 'medium', mode = 'primary' } = props

    return (
      <button
        class={['Button', `Button--${size}`, `Button--${mode}`, {
          'Button--wide': props.wide,
          'Button--loading': props.loading
        }]}
        type="button"
      >
        <span class="Button__in">
          {props.before}
          {slots.default?.()}
          {props.after}
        </span>
        {props.loading && <Spinner class="Button__spinner" />}
      </button>
    )
  }
})

Button.props = ['size', 'mode', 'wide', 'before', 'after', 'loading']
