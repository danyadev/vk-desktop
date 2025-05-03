import { defineComponent, watch } from 'vue'
import { useInView } from 'hooks'
import { RenderSlotWithProps } from 'ui/ui/RenderSlotWithProps/RenderSlotWithProps'

type Props = {
  onIntersect: () => void
}

export const IntersectionWrapper = defineComponent<Props>((props, { slots }) => {
  const { ref, inView } = useInView()

  watch(inView, () => {
    inView.value && props.onIntersect()
  })

  return () => <RenderSlotWithProps ref={ref}>{slots.default?.()}</RenderSlotWithProps>
}, {
  props: ['onIntersect']
})
