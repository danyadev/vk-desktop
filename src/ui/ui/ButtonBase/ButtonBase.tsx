import { defineComponent, HTMLAttributes } from 'vue'
import { useFocusVisible } from 'hooks'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import './ButtonBase.css'

type InheritedProps = HTMLAttributes & {
  href?: string
  disabled?: boolean
}
export type ButtonBaseProps = InheritedProps & {
  focusOutside?: boolean
}

export const ButtonBase = defineComponent<ButtonBaseProps>((props, { slots, attrs }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()

  return () => {
    const restProps = attrs as InheritedProps
    const Component = restProps.href ? 'a' : 'button'
    const componentRelatedProps = Component === 'button'
      ? { type: 'button' } as const
      : { target: '_blank' } as const
    const disableFocusProps = restProps.disabled && { tabindex: -1 }

    return (
      <Component
        class="ButtonBase"
        {...componentRelatedProps}
        {...disableFocusProps}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        {slots.default?.()}
        <FocusVisible isFocused={isFocused.value} outside={props.focusOutside} />
      </Component>
    )
  }
}, {
  props: ['focusOutside']
})
