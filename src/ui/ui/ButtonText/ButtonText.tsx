import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { useFocusVisible } from 'hooks'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import './ButtonText.css'

type Props = ButtonHTMLAttributes

export const ButtonText = defineComponent<Props>((props, { slots }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()

  return () => (
    <button type="button" class="ButtonText" onBlur={onBlur} onFocus={onFocus}>
      {slots.default?.()}
      <FocusVisible isFocused={isFocused.value} outside />
    </button>
  )
})
