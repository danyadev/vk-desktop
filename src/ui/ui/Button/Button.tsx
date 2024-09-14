import { defineComponent, HTMLAttributes } from 'vue'
import { useFocusVisible } from 'hooks'
import { JSXElement } from 'misc/utils'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './Button.css'

type InheritedProps = HTMLAttributes & {
  href?: string
  disabled?: boolean
}
type Props = {
  size?: 'small' | 'medium' | 'large'
  mode?: 'primary' | 'secondary' | 'destructive' | 'tertiary' | 'outline'
  wide?: boolean
  before?: JSXElement
  after?: JSXElement
  loading?: boolean
} & InheritedProps

export const Button = defineComponent<Props>((props, { slots, attrs }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()

  return () => {
    const { size = 'medium', mode = 'primary' } = props
    const restProps = attrs as InheritedProps

    const Component = restProps.href ? 'a' : 'button'
    const componentRelatedProps = Component === 'button'
      ? { type: 'button' } as const
      : { target: '_blank' } as const
    const disableFocusProps = restProps.disabled && { tabindex: -1 }

    return (
      <Component
        class={['Button', `Button--${size}`, `Button--${mode}`, {
          'Button--wide': props.wide,
          'Button--loading': props.loading
        }]}
        {...componentRelatedProps}
        {...disableFocusProps}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        <span class="Button__in">
          {props.before}
          {slots.default?.()}
          {props.after}
        </span>
        {props.loading && <Spinner class="Button__spinner" color="inherit" />}
        <FocusVisible isFocused={isFocused.value} />
      </Component>
    )
  }
}, {
  props: ['size', 'mode', 'wide', 'before', 'after', 'loading']
})
