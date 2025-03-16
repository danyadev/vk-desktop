import { defineComponent } from 'vue'
import { ClassName } from 'misc/utils'
import './ModalBody.css'

type Props = {
  withoutPadding?: boolean
  class?: ClassName
}

export const ModalBody = defineComponent<Props>((props, { slots }) => {
  return () => (
    <div class={['ModalBody', !props.withoutPadding && 'ModalBody--withPadding']}>
      {slots.default?.()}
    </div>
  )
}, {
  props: ['withoutPadding']
})
