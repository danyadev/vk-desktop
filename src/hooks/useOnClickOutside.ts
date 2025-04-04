import { onScopeDispose, Ref } from 'vue'
import { RefElement, unrefElement } from 'misc/utils'

export const useOnClickOutside = (elementRef: Ref<RefElement>, onClickOutside: () => void) => {
  const onMouseDown = (event: MouseEvent) => {
    const element = unrefElement(elementRef)

    if (element && event.target instanceof HTMLElement && !element.contains(event.target)) {
      onClickOutside()
    }
  }

  window.addEventListener('mousedown', onMouseDown)
  onScopeDispose(() => window.removeEventListener('mousedown', onMouseDown))
}
