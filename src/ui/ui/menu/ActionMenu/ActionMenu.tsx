import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import './ActionMenu.css'

type Props = {
  actions: JSXElement[]
}

export const ActionMenu = defineComponent<Props>((props) => {
  return () => (
    <nav class="ActionMenu">
      {props.actions.map((action) => (action))}
    </nav>
  )
}, {
  props: ['actions']
})
