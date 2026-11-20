import { defineComponent, HTMLAttributes } from 'vue'
import './TabsItem.css'

type Props = {
  active: boolean
} & HTMLAttributes

export const TabsItem = defineComponent<Props>((props, { slots }) => {
  return () => (
    <button
      type="button"
      class={['TabsItem', props.active && 'TabsItem--active']}
    >
      {slots.default?.()}
    </button>
  )
}, {
  props: ['active']
})
