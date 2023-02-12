import { computed, ref } from 'vue'
import { createSingletonHook } from 'misc/utils'

export function useFocusVisible() {
  const isFocusedByEvent = ref(false)
  const isFocusedByTab = useTabFocusTracker()

  return {
    isFocused: computed(() => isFocusedByEvent.value && isFocusedByTab.value),
    onBlur: () => (isFocusedByEvent.value = false),
    onFocus: () => (isFocusedByEvent.value = true)
  }
}

const useTabFocusTracker = createSingletonHook(() => {
  const isFocusedByTab = ref(false)

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      isFocusedByTab.value = true
    }
  }

  function handleAction() {
    isFocusedByTab.value = false
  }

  const options = {
    passive: true,
    capture: true
  }

  window.addEventListener('keydown', handleKeydown, options)
  window.addEventListener('mousedown', handleAction, options)
  window.addEventListener('touchstart', handleAction, options)

  return isFocusedByTab
})
