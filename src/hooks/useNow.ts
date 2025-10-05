import { onScopeDispose, shallowRef } from 'vue'
import { createSharedComposable } from 'misc/utils'

export const useNow = createSharedComposable((interval: number) => {
  const now = shallowRef(Date.now())

  const intervalId = setInterval(() => {
    now.value = Date.now()
  }, interval)

  onScopeDispose(() => {
    clearInterval(intervalId)
  })

  return now
})
