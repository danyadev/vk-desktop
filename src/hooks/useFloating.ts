import { onMounted, ref } from 'vue'

import { computePosition } from '@floating-ui/dom'

function useFloating() {
  const $floatingRef = ref<HTMLElement | null>(null)
  const $referenceRef = ref<Element | null>(null)

  const setReference = (element: Element) => {
    $referenceRef.value = element
  }

  const setFloating = (element: HTMLElement) => {
    $floatingRef.value = element
  }

  async function updatePosition() {
    const referenceValue = $referenceRef.value
    const floatingValue = $floatingRef.value

    if (referenceValue && floatingValue) {
      try {
        const { x, y } = await computePosition(referenceValue, floatingValue)

        Object.assign(floatingValue.style, {
          left: `${x}px`,
          top: `${y}px`
        })
      } catch (error) {
        console.warn(error)
      }
    }
  }

  onMounted(() => {
    updatePosition()
  })

  return {
    refs: {
      setReference,
      setFloating
    }
  }
}

console.log(useFloating())
