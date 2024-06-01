import { shallowRef } from 'vue'

export function useNow(interval: number) {
  const now = shallowRef(Date.now())

  setInterval(() => {
    now.value = Date.now()
  }, interval)

  return now
}
