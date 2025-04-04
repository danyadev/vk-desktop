import { computed, defineComponent, KeyboardEvent, shallowRef } from 'vue'
import { useEnv, useOnClickOutside } from 'hooks'
import { Icon16CheckOutline, Icon24ChevronDown, Icon24ChevronUp } from 'assets/icons'
import './Select.css'

type SelectOption<Value> = { label: string, value: Value }

type Props<Value> = {
  selected: Value
  onSelect: (value: Value) => void
  options: Array<SelectOption<Value>>
  inLayer?: boolean
}

export const Select = defineComponent(<Value extends string>(props: Props<Value>) => {
  const { lang } = useEnv()
  const isExpanded = shallowRef(false)
  const $select = shallowRef<HTMLElement | null>(null)
  const $selectField = shallowRef<HTMLElement | null>(null)

  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value

    if (!isExpanded.value) {
      // Если закрыть список, когда фокус стоит на одном из вариантов, то фокус полностью пропадет,
      // и при взаимодействии через Tab приходилось добираться до селекта заново
      $selectField.value?.focus()
    }
  }

  const handleEscape = (event: KeyboardEvent) => {
    if (isExpanded.value && event.key === 'Escape') {
      event.stopPropagation()
      toggleExpanded()
    }
  }

  const selectOption = (option: SelectOption<Value>) => {
    props.onSelect(option.value)
    toggleExpanded()
  }

  useOnClickOutside($select, () => {
    isExpanded.value && toggleExpanded()
  })

  const selectedOption = computed(() => (
    props.options.find(({ value }) => value === props.selected)
  ))

  return () => (
    <div
      class={['Select', props.inLayer && 'Select--inLayer', isExpanded.value && 'Select--expanded']}
      onKeydown={handleEscape}
      ref={$select}
    >
      <div
        class="Select__field"
        tabindex="0"
        onClick={toggleExpanded}
        onKeydown={(e) => e.key === 'Enter' && toggleExpanded()}
        ref={$selectField}
      >
        <span class={['Select__value', !selectedOption.value && 'Select__value--empty']}>
          {selectedOption.value?.label ?? lang.use('select_not_selected')}
        </span>

        {isExpanded.value ? (
          <Icon24ChevronUp class="Select__chevron" />
        ) : (
          <Icon24ChevronDown class="Select__chevron" />
        )}
      </div>

      {isExpanded.value && (
        <div class="Select__options">
          {props.options.map((option) => (
            <div
              class="Select__option"
              key={option.value}
              tabindex="0"
              onClick={() => selectOption(option)}
              onKeydown={(e) => e.key === 'Enter' && selectOption(option)}
            >
              <span class="Select__optionText">{option.label}</span>
              {option.value === props.selected && (
                <Icon16CheckOutline class="Select__checkedOptionIcon" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}, {
  props: ['selected', 'onSelect', 'options', 'inLayer']
})
