import { shallowRef } from 'vue'
import { createSingletonHook } from 'misc/utils'

export const usePixelDensity = createSingletonHook(() => {
  const isDense = shallowRef(false)

  const onChange = () => {
    isDense.value = window.devicePixelRatio >= 1.25
  }
  onChange()

  const match = window.matchMedia('(resolution: 1.25dppx)')
  match.addEventListener('change', onChange)

  return isDense
})
