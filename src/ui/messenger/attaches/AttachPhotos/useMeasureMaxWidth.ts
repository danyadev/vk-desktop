import { shallowRef, watch } from 'vue'
import { useResizeObserver } from 'hooks'
import { debounce, RefElement, unrefElement } from 'misc/utils'

export function useMeasureMaxWidth() {
  const maxWidth = shallowRef(0)
  const isMeasured = shallowRef(false)
  const measureElRef = shallowRef<RefElement>(null)
  let skipResize = false

  const parentRef = useResizeObserver(debounce(() => {
    if (skipResize) {
      skipResize = false
      return
    }

    isMeasured.value = false
  }, 1000 / 30))

  watch(measureElRef, () => {
    const parent = unrefElement(measureElRef)?.parentElement
    if (parent) {
      parentRef.value = parent
    }
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
    skipResize = true
  }, { flush: 'post' })

  return { measureElRef, maxWidth, isMeasured }
}
