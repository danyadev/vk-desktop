import { shallowRef } from 'vue'
import { createSingletonHook } from 'misc/utils'

export const usePixelDensity = createSingletonHook(() => {
  const mediaQuery = window.matchMedia('(min-resolution: 1.25dppx)')
  const isDense = shallowRef(mediaQuery.matches)

  mediaQuery.addEventListener('change', ({ matches }) => {
    isDense.value = matches
  })

  return isDense
})
