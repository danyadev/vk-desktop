import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { useFocusVisible } from 'hooks'
import { JSXElement } from 'misc/utils'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import './ButtonIcon.css'

type Props = {
  icon?: JSXElement
  stretched?: boolean
  addHoverBackground?: boolean
} & ButtonHTMLAttributes

export const ButtonIcon = defineComponent<Props>((props, { slots }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()
  const { addHoverBackground = true } = props
  return () => (
    <button
      type="button"
      class={['ButtonIcon', {
        'ButtonIcon--stretched': props.stretched,
        'ButtonIcon--hoverBackground': addHoverBackground
      }]}
      onBlur={onBlur}
      onFocus={onFocus}
    >
      {props.icon}
      {slots.default?.()}
      <FocusVisible isFocused={isFocused.value} />
    </button>
  )
}, {
  props: ['icon', 'stretched', 'addHoverBackground']
})
