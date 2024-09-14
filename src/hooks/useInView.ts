import { Ref, shallowRef, watchPostEffect } from 'vue'
import { RefElement, unrefElement } from 'misc/utils'

export function useInView() {
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
  })

  return { ref, inView }
}

function useIntersectionObserver(ref: Ref<RefElement>, callback: IntersectionObserverCallback) {
  watchPostEffect(() => {
    const target = unrefElement(ref)

    if (!target) {
      return
    }

    const observer = new IntersectionObserver(callback)
    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  })
}
