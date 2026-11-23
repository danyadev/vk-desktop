import { Ref, shallowRef, watchPostEffect } from 'vue'
import { RefElement, unrefElement } from 'misc/utils'

export function useInView(options: IntersectionObserverInit = {}) {
  const ref = shallowRef<RefElement>(null)
  const inView = shallowRef(false)

  useIntersectionObserver(ref, (entries) => {
    let isIntersecting = inView.value
    let latestTime = 0

    for (const entry of entries) {
      if (entry.time >= latestTime) {
        latestTime = entry.time
        isIntersecting = entry.isIntersecting
      }
    }

    inView.value = isIntersecting
  }, options)

  return { ref, inView }
}

function useIntersectionObserver(
  targetRef: Ref<RefElement>,
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit
) {
  watchPostEffect((onCleanup) => {
    const target = unrefElement(targetRef)
    if (!target) {
      return
    }

    const observer = new IntersectionObserver(callback, options)
    observer.observe(target)

    onCleanup(() => {
      observer.disconnect()
    })
  })
}
