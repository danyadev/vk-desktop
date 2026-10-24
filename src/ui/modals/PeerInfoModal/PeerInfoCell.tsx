import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import './PeerInfoCell.css'

type Props = {
  icon: JSXElement
}

export const PeerInfoCell = defineComponent<Props>((props, { slots }) => {
  return () => (
    <div class="PeerInfoCell">
      <span class="PeerInfoCell__icon">{props.icon}</span>
      <div class="PeerInfoCell__content">{slots.default?.()}</div>
    </div>
  )
}, {
  props: ['icon']
})
