import './Button.css'
import { defineComponent, ButtonHTMLAttributes } from 'vue'
import { JSXElement } from 'misc/utils'

type Props = {
  size?: 'small' | 'medium' | 'large'
  mode?: 'primary' | 'secondary' | 'tertiary' | 'outline'
  wide?: boolean
  before?: JSXElement
  after?: JSXElement
} & ButtonHTMLAttributes

export const Button = defineComponent<Props>((props, { slots }) => {
  return () => {
    const { size = 'medium', mode = 'primary' } = props

    return (
      <button
        class={['Button', `Button--${size}`, `Button--${mode}`, props.wide && 'Button--wide']}
        type="button"
      >
        <span class="Button__in">
          {props.before}
          {slots.default?.()}
          {props.after}
        </span>
      </button>
    )
  }
})

Button.props = ['size', 'mode', 'wide', 'before', 'after']
