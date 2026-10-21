import { shallowRef, watchEffect } from 'vue'
import { autoUpdate, computePosition, ComputePositionConfig, VirtualElement } from '@floating-ui/dom'
import { RawRefElement, unrefElement } from 'misc/utils'

export function useFloatingUI(options: ComputePositionConfig) {
  const $content = shallowRef<HTMLElement | null>(null)
  const $trigger = shallowRef<HTMLElement | VirtualElement | null>(null)
  const effectivePlacement = shallowRef(options.placement ?? 'bottom')

  const setTriggerRef = (refElement: RawRefElement) => {
    const element = unrefElement(refElement)
    if (!element || element instanceof HTMLElement) {
      $trigger.value = element
    }
  }

  const setVirtualTrigger = (trigger: VirtualElement | null) => {
    $trigger.value = trigger
  }

  const setContentRef = (refElement: RawRefElement) => {
    const element = unrefElement(refElement)
    if (!element || element instanceof HTMLElement) {
      $content.value = element
    }
  }

  async function update() {
    const trigger = $trigger.value
    const content = $content.value
    if (!trigger || !content) return

    const { x, y, placement } = await computePosition(trigger, content, options)
    if ($trigger.value !== trigger || $content.value !== content) return

    content.style.left = `${x}px`
    content.style.top = `${y}px`
    effectivePlacement.value = placement
  }

  watchEffect((onCleanup) => {
    if (!$trigger.value || !$content.value) return
    onCleanup(autoUpdate($trigger.value, $content.value, update))
  })

  return {
    setTriggerRef,
    setVirtualTrigger,
    setContentRef,
    effectivePlacement
  }
}
