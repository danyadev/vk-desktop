import { defineComponent, HTMLAttributes } from 'vue'
import './TabsItem.css'

type Props = {
  active: boolean
} & HTMLAttributes

export const TabsItem = defineComponent<Props>((props, { slots }) => {
  return () => (
    <div class={['TabsItem', props.active && 'TabsItem--active']}>
      {slots.default?.()}
    </div>
  )
}, {
  props: ['active']
})
