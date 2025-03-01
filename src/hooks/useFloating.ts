import { ComponentPublicInstance, onUnmounted, shallowRef, watchEffect } from 'vue'

import { autoUpdate, computePosition, ComputePositionConfig } from '@floating-ui/dom'

export function useFloating(options: Partial<ComputePositionConfig>, color?: string) {
  const $floatingRef = shallowRef<HTMLElement | null>(null)
  const $referenceRef = shallowRef<HTMLElement | null>(null)
  const cleanup = shallowRef<unknown>(null)

  const setReference = (element: Element | ComponentPublicInstance | null) => {
    if (element instanceof HTMLElement) {
      $referenceRef.value = element
    }
  }

  const setFloating = (element: Element | ComponentPublicInstance | null) => {
    if (element instanceof HTMLElement) {
      $floatingRef.value = element
    }
  }

  const setColor = () => {
    if ($referenceRef.value) {
      $referenceRef.value.style.backgroundColor = color ?? 'transparent'
    }
  }

  const removeColor = () => {
    if ($referenceRef.value) {
      $referenceRef.value.style.removeProperty('background')
    }
  }

  async function update() {
    if ($referenceRef.value && $floatingRef.value) {
      try {
        const { x, y } = await computePosition($referenceRef.value, $floatingRef.value, options)

        $floatingRef.value.style.left = `${x}px`
        $floatingRef.value.style.top = `${y}px`
      } catch (error) {
        console.warn(error)
      }
    }
  }

  watchEffect(() => {
    if ($referenceRef.value && $floatingRef.value) {
      cleanup.value = autoUpdate(
        $referenceRef.value,
        $floatingRef.value,
        update
      )

      $floatingRef.value.addEventListener(('mouseover'), setColor)
      $floatingRef.value.addEventListener(('mouseout'), removeColor)
    }
  })

  onUnmounted(() => {
    cleanup.value = null
  })

  return {
    refs: {
      setReference,
      setFloating
    }
  }
}
