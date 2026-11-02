import { defineComponent } from 'vue'
import { useFocusVisible } from 'hooks'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import { Icon20CheckboxOff, Icon20CheckboxOn } from 'assets/icons'
import './Checkbox.css'

type Props = {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export const Checkbox = defineComponent<Props>((props) => {
  const { isFocused, onFocus, onBlur } = useFocusVisible()
  const toggle = () => !props.disabled && props.onChange(!props.checked)

  return () => (
    <div
      class={['Checkbox', !props.checked && 'Checkbox--off', props.disabled && 'Checkbox--disabled']}
      tabindex={props.disabled ? -1 : 0}
      onClick={toggle}
      onKeydown={(e) => e.key === 'Enter' && toggle()}
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
  props: ['label', 'checked', 'disabled', 'onChange']
})
