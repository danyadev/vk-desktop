import './ButtonIcon.css'

import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import { useFocusVisible } from 'misc/hooks'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'

type Props = {
  icon?: JSXElement
  stretched?: boolean
} & ButtonHTMLAttributes

export const ButtonIcon = defineComponent<Props>((props, { slots }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()

  return () => (
    <button
      type="button"
      class={['ButtonIcon', props.stretched && 'ButtonIcon--stretched']}
      onBlur={onBlur}
      onFocus={onFocus}
    >
      {props.icon}
      {slots.default?.()}
      <FocusVisible isFocused={isFocused.value} />
    </button>
  )
}, {
  props: ['icon', 'stretched']
})
