import { defineComponent } from 'vue'
import './ActionMenu.css'

type Props = {

}

export const ActionMenu = defineComponent<Props>((props, { slots }) => {
  return () => (
    <div class="ActionMenu">
      {slots.default?.()}
    </div>
  )
})
