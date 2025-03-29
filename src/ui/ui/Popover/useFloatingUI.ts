import { shallowRef, watchEffect } from 'vue'
import { autoUpdate, computePosition, ComputePositionConfig } from '@floating-ui/dom'
import { RawRefElement, unrefElement } from 'misc/utils'

export function useFloatingUI(options: ComputePositionConfig) {
  const $content = shallowRef<HTMLElement | null>(null)
  const $trigger = shallowRef<HTMLElement | null>(null)
  let cleanup: (() => void) | null = null

  const setTriggerRef = (refElement: RawRefElement) => {
    const element = unrefElement(refElement)
    if (!element || element instanceof HTMLElement) {
      $trigger.value = element
    }
  }

  const setContentRef = (refElement: RawRefElement) => {
    const element = unrefElement(refElement)
    if (!element || element instanceof HTMLElement) {
      $content.value = element
    }
  }

  async function update() {
    if ($trigger.value && $content.value) {
      const { x, y } = await computePosition($trigger.value, $content.value, options)

      $content.value.style.left = `${x}px`
      $content.value.style.top = `${y}px`
    }
  }

  watchEffect(() => {
    cleanup?.()

    if ($trigger.value && $content.value) {
      cleanup = autoUpdate(
        $trigger.value,
        $content.value,
        update
      )
    } else {
      cleanup = null
    }
  })

  return {
    setTriggerRef,
    setContentRef
  }
}
