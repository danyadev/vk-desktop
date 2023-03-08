import { onMounted, shallowRef } from 'vue'

export function useIsMounted() {
  const isMounted = shallowRef(false)

  onMounted(() => {
    isMounted.value = true
  })

  return isMounted
}
