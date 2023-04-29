import './ModalBody.css'

import { defineComponent } from 'vue'

type Props = {
  /** Убирает стандартные отступы */
  withCustomLayout?: boolean
}

export const ModalBody = defineComponent<Props>((props, { slots }) => {
  return () => (
    <div class={['ModalBody', !props.withCustomLayout && 'ModalBody--standard']}>
      {slots.default?.()}
    </div>
  )
})

ModalBody.props = ['withCustomLayout']
