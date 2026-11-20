import { defineComponent, HTMLAttributes } from 'vue'
import { HorizontalScroll } from 'ui/ui/HorizontalScroll/HorizontalScroll'
import './Tabs.css'

type Props = {
  wide?: boolean
} & HTMLAttributes

export const Tabs = defineComponent<Props>((props, { slots }) => {
  return () => (
    <HorizontalScroll innerClass={['Tabs', props.wide && 'Tabs--wide']} size="small">
      {slots.default?.()}
    </HorizontalScroll>
  )
}, {
  props: ['wide']
})
