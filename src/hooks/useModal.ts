import { computed, reactive, shallowRef } from 'vue'

export function useModal() {
  const opened = shallowRef(false)
  const hidden = shallowRef(false)

  return reactive({
    opened,
    hidden: computed(() => opened.value && hidden.value),

    open: () => (opened.value = true),
    close: () => (opened.value = false),

    hide: () => (hidden.value = true),
    unhide: () => (hidden.value = false)
  })
}
