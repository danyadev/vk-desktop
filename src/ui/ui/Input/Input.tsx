import { defineComponent, InputHTMLAttributes, onMounted, shallowRef } from 'vue'
import { ClassName, JSXElement } from 'misc/utils'
import { Icon24Cancel, Icon24SearchOutline } from 'assets/icons'
import './Input.css'

type InheritedProps = Omit<InputHTMLAttributes, 'size'>
type Props = {
  mode?: 'default' | 'layer' | 'search'
  size?: 'regular' | 'small'
  before?: JSXElement
  after?: JSXElement
  autofocus?: boolean
  class?: ClassName
} & InheritedProps

export const Input = defineComponent<Props>((props, { attrs }) => {
  const $input = shallowRef<HTMLInputElement | null>(null)
  const inputValue = shallowRef('')

  onMounted(() => {
    if (props.autofocus) {
      $input.value?.focus()
    }
  })

  const clear = () => {
    const input = $input.value
    if (!input) return

    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.focus()
  }

  return () => {
    const { mode = 'default', size = 'regular' } = props
    const { type = 'text', onInput, ...restProps } = attrs as InheritedProps
    const before = props.before ??
      (mode === 'search' && <Icon24SearchOutline width={20} height={20} />)
    const hasClear = mode === 'search' && !restProps.disabled &&
      String(restProps.value ?? inputValue.value).length > 0

    return (
      <div class={['Input', props.class, `Input--${mode}`, `Input--${size}`]}>
        <label class="Input__field">
          {before && <div class="Input__before">{before}</div>}
          <input
            class="Input__el"
            type={mode === 'search' ? 'search' : type}
            {...restProps}
            onInput={(event) => {
              inputValue.value = event.target.value
              onInput?.(event)
            }}
            ref={$input}
          />
          {hasClear && (
            <button type="button" class="Input__clear" onClick={clear}>
              <Icon24Cancel width={20} height={20} />
            </button>
          )}
          {props.after && <div class="Input__after">{props.after}</div>}
        </label>
      </div>
    )
  }
}, {
  props: ['mode', 'size', 'before', 'after', 'autofocus', 'class'],
  inheritAttrs: false
})
