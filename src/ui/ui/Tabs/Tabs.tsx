import { defineComponent, HTMLAttributes } from 'vue'
import { HorizontalScroll } from 'ui/ui/HorizontalScroll/HorizontalScroll'
import './Tabs.css'

export const Tabs = defineComponent<HTMLAttributes>((props, { slots }) => {
  return () => (
    <HorizontalScroll innerClass="Tabs" size="small">
      {slots.default?.()}
    </HorizontalScroll>
  )
})
