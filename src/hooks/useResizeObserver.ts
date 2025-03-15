import { Ref, watchPostEffect } from 'vue'
import { RefElement, unrefElement } from 'misc/utils'

export function useResizeObserver(
  targetRef: Ref<RefElement>,
  onResize: (entry: ResizeObserverEntry) => void
) {
  watchPostEffect((onCleanup) => {
    const target = unrefElement(targetRef)
    if (!target) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        onResize(entries[0])
      }
    })
    observer.observe(target)

    onCleanup(() => {
      observer.disconnect()
    })
  })
}
