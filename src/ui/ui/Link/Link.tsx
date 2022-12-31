import './Link.css'
import { defineComponent, AnchorHTMLAttributes } from 'vue'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import { useFocusVisible } from 'misc/hooks/useFocusVisible'

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
