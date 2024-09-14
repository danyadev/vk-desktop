import { onMounted, onUnmounted, shallowRef } from 'vue'

export function useIsMounted() {
  const isMounted = shallowRef(false)

  onMounted(() => {
    isMounted.value = true
  })

  onUnmounted(() => {
    isMounted.value = false
  })

  return isMounted
}
