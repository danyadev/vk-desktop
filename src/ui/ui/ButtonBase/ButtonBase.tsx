import { AnchorHTMLAttributes, ButtonHTMLAttributes, defineComponent } from 'vue'
import { useFocusVisible } from 'hooks'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import './ButtonBase.css'

type InheritedProps = ButtonHTMLAttributes | AnchorHTMLAttributes
export type ButtonBaseProps = InheritedProps & {
  focusStyle?: 'inside' | 'outside' | 'none'
}

export const ButtonBase = defineComponent<ButtonBaseProps>((props, { slots, attrs }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()

  return () => {
    const restProps = attrs as InheritedProps
    const Component = 'href' in restProps ? 'a' : 'button'
    const componentRelatedProps = Component === 'button'
      ? { type: 'button' } as const
      : { target: '_blank' } as const
    const disableFocusProps = 'disabled' in restProps && restProps.disabled && { tabindex: -1 }

    return (
      <Component
        class="ButtonBase"
        {...componentRelatedProps}
        {...disableFocusProps}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        {slots.default?.()}
        {props.focusStyle !== 'none' && (
          <FocusVisible isFocused={isFocused.value} outside={props.focusStyle === 'outside'} />
        )}
      </Component>
    )
  }
}, {
  props: ['focusStyle']
})
