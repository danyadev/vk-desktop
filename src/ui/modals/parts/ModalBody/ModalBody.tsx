import { defineComponent } from 'vue'
import { ClassName } from 'misc/utils'
import './ModalBody.css'

type Props = {
  /** Убирает стандартные отступы */
  withCustomLayout?: boolean
  class?: ClassName
}

export const ModalBody = defineComponent<Props>((props, { slots }) => {
  return () => (
    <div class={['ModalBody', !props.withCustomLayout && 'ModalBody--standard']}>
      {slots.default?.()}
    </div>
  )
}, {
  props: ['withCustomLayout']
})
