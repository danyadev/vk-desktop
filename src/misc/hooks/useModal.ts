import { computed, ref } from 'vue'

export function useModal() {
  const opened = ref(false)
  const hidden = ref(false)

  return {
    opened,
    hidden: computed(() => opened.value && hidden.value),

    open: () => (opened.value = true),
    close: () => (opened.value = false),

    hide: () => (hidden.value = true),
    unhide: () => (hidden.value = false)
  }
}
