import './Input.css'
import { defineComponent, InputHTMLAttributes, onMounted, ref } from 'vue'
import { JSXElement } from 'misc/utils'

type InheritedProps = InputHTMLAttributes
type Props = {
  before?: JSXElement
  after?: JSXElement
  autofocus?: boolean
} & InheritedProps

export const Input = defineComponent<Props>((props, { attrs }) => {
  const inputRef = ref<HTMLInputElement | null>(null)

  onMounted(() => {
    if (props.autofocus) {
      inputRef.value?.focus()
    }
  })

  return () => {
    const { before, after } = props
    const { type = 'text', ...restProps } = attrs as InheritedProps

    return (
      <div
        class={['Input', {
          'Input--hasBefore': before,
          'Input--hasAfter': after
        }]}
      >
        {before && <div class="Input__before">{before}</div>}
        <input class="Input__el" type={type} {...restProps} ref={inputRef} />
        {after && <div class="Input__after">{after}</div>}
      </div>
    )
  }
})

Input.props = ['before', 'after', 'autofocus']
Input.inheritAttrs = false
