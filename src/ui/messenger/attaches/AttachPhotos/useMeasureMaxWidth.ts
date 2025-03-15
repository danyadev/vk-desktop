import { Ref, shallowRef, watch } from 'vue'
import { RefElement, unrefElement } from 'misc/utils'

export function useMeasureMaxWidth(invalidateKey: Ref<unknown>) {
  const maxWidth = shallowRef(0)
  const isMeasured = shallowRef(false)
  const measureElRef = shallowRef<RefElement>(null)

  watch(invalidateKey, () => {
    isMeasured.value = false
  })

  watch([isMeasured, measureElRef], () => {
    if (isMeasured.value) {
      return
    }

    const target = unrefElement(measureElRef)
    if (!target) {
      return
    }

    maxWidth.value = target.clientWidth
    isMeasured.value = true
  }, { flush: 'post' })

  return { measureElRef, maxWidth, isMeasured }
}
