import { Ref, shallowRef, watchPostEffect } from 'vue'
import { RefElement, unrefElement } from 'misc/utils'

export function useInView(threshold = 0) {
  const ref = shallowRef<RefElement>(null)
  const inView = shallowRef(false)

  useIntersectionObserver(ref, (entries) => {
    let isIntersecting = inView.value
    let latestTime = 0

    for (const entry of entries) {
      if (entry.time >= latestTime) {
        latestTime = entry.time
        isIntersecting = entry.isIntersecting && entry.intersectionRatio >= threshold
      }
    }

    inView.value = isIntersecting
  }, { threshold })

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
