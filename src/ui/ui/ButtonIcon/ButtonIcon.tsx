import './ButtonIcon.css'
import { defineComponent } from 'vue'
import { useFocusVisible } from 'misc/hooks'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import { JSXElement } from 'misc/utils'

type Props = {
  icon?: JSXElement
}

export const ButtonIcon = defineComponent<Props>((props, { slots }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()

  return () => (
    <button class="ButtonIcon" onBlur={onBlur} onFocus={onFocus}>
      {props.icon}
      {slots.default?.()}
      <FocusVisible isFocused={isFocused.value} />
    </button>
  )
})

ButtonIcon.props = ['icon']
