import { AnchorHTMLAttributes, defineComponent } from 'vue'
import { useFocusVisible } from 'hooks'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import './Link.css'

type Props = AnchorHTMLAttributes

export const Link = defineComponent<Props>((props, { slots }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()

  return () => (
    <a class="Link" target="_blank" onBlur={onBlur} onFocus={onFocus}>
      {slots.default?.()}
      <FocusVisible isFocused={isFocused.value} outside />
    </a>
  )
})
