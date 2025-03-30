import { defineComponent } from 'vue'
import { useFocusVisible } from 'hooks'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import { Icon20CheckboxOff, Icon20CheckboxOn } from 'assets/icons'
import './Checkbox.css'

type Props = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export const Checkbox = defineComponent<Props>((props) => {
  const { isFocused, onFocus, onBlur } = useFocusVisible()

  return () => (
    <div
      class={['Checkbox', !props.checked && 'Checkbox--off']}
      tabindex="0"
      onClick={() => props.onChange(!props.checked)}
      onKeydown={(e) => e.key === 'Enter' && props.onChange(!props.checked)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {props.checked ? (
        <Icon20CheckboxOn class="Checkbox__icon" />
      ) : (
        <Icon20CheckboxOff class="Checkbox__icon" />
      )}
      <span>{props.label}</span>
      <FocusVisible isFocused={isFocused.value} />
    </div>
  )
}, {
  props: ['label', 'checked', 'onChange']
})
