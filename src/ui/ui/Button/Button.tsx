import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import { ButtonBase, ButtonBaseProps } from 'ui/ui/ButtonBase/ButtonBase'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './Button.css'

type Props = {
  size?: 'small' | 'medium' | 'large'
  mode?: 'primary' | 'secondary' | 'destructive' | 'tertiary' | 'outline'
  wide?: boolean
  before?: JSXElement
  after?: JSXElement
  loading?: boolean
} & ButtonBaseProps

export const Button = defineComponent<Props>((props, { slots }) => {
  return () => {
    const { size = 'medium', mode = 'primary' } = props

    return (
      <ButtonBase
        class={['Button', `Button--${size}`, `Button--${mode}`, {
          'Button--wide': props.wide,
          'Button--loading': props.loading
        }]}
      >
        <span class="Button__in">
          {props.before}
          {slots.default?.()}
          {props.after}
        </span>
        {props.loading && <Spinner class="Button__spinner" color="inherit" />}
      </ButtonBase>
    )
  }
}, {
  props: ['size', 'mode', 'wide', 'before', 'after', 'loading']
})
