import './Input.css'

import { defineComponent, InputHTMLAttributes, onMounted, shallowRef } from 'vue'
import { ClassName, JSXElement } from 'misc/utils'

type InheritedProps = InputHTMLAttributes
type Props = {
  before?: JSXElement
  after?: JSXElement
  autofocus?: boolean
  class?: ClassName
  /** Признак нахождения в слое, например в модалке, где фон слоя сливается с фоном поля ввода */
  inLayer?: boolean
} & InheritedProps

export const Input = defineComponent<Props>((props, { attrs }) => {
  const $input = shallowRef<HTMLInputElement | null>(null)

  onMounted(() => {
    if (props.autofocus) {
      $input.value?.focus()
    }
  })

  return () => {
    const { before, after } = props
    const { type = 'text', ...restProps } = attrs as InheritedProps

    return (
      <div
        class={['Input', props.class, {
          'Input--hasBefore': before,
          'Input--hasAfter': after,
          'Input--inLayer': props.inLayer
        }]}
      >
        {before && <div class="Input__before">{before}</div>}
        <input class="Input__el" type={type} {...restProps} ref={$input} />
        {after && <div class="Input__after">{after}</div>}
      </div>
    )
  }
}, {
  props: ['before', 'after', 'autofocus', 'class', 'inLayer'],
  inheritAttrs: false
})
