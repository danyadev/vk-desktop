import { defineComponent, watch } from 'vue'
import { useInView } from 'hooks'
import './IntersectionWrapper.css'

type Props = {
  onIntersect: () => void
}

export const IntersectionWrapper = defineComponent<Props>((props, { slots }) => {
  const { ref, inView } = useInView()

  watch(inView, () => {
    inView.value && props.onIntersect()
  })

  return () => (
    <div class="IntersectionWrapper" ref={ref}>{slots.default?.()}</div>
  )
}, {
  props: ['onIntersect']
})
