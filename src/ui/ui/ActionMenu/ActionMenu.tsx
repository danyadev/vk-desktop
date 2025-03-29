import { defineComponent, HTMLAttributes } from 'vue'
import './ActionMenu.css'

type Props = HTMLAttributes

export const ActionMenu = defineComponent<Props>((props, { slots }) => {
  return () => (
    <div class="ActionMenu">
      {slots.default?.()}
    </div>
  )
})
