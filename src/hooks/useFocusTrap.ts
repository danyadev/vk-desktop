import { FocusEvent, onUnmounted, Ref, shallowRef, watch } from 'vue'
import { NonEmptyArray } from 'misc/utils'

const activeTraps: symbol[] = []

export function useFocusTrap(
  $focusRoot: Ref<HTMLElement | null>,
  active: Ref<boolean> = shallowRef(true)
) {
  const trapId = Symbol()
  const isTopTrap = () => activeTraps.at(-1) === trapId

  let initialFocusedElement: Element | null = null
  let isPageBecomeActive = false

  const deactivate = () => {
    const index = activeTraps.indexOf(trapId)
    if (index === -1) return

    const shouldRestoreFocus = isTopTrap()
    activeTraps.splice(index, 1)
    if (shouldRestoreFocus && initialFocusedElement instanceof HTMLElement) {
      initialFocusedElement.focus()
    }
  }

  watch(active, (enabled) => {
    if (enabled) {
      if (activeTraps.includes(trapId)) return

      initialFocusedElement = document.activeElement
      isPageBecomeActive = false
      activeTraps.push(trapId)
    } else {
      deactivate()
    }
  }, { immediate: true, flush: 'sync' })

  watch([active, $focusRoot], ([enabled, root]) => {
    if (!enabled || !root || !isTopTrap()) {
      return
    }
    if (!root.contains(document.activeElement)) {
      root.focus()
    }
  }, { immediate: true })

  onUnmounted(deactivate)

  /**
   * event.relatedTarget - предыдущий сфокусированный элемент
   * event.target - текущий сфокусированный элемент
   */
  function onFocusIn(event: FocusEvent<HTMLElement>) {
    /**
     * Произошла активация окна страницы, фокус автоматически выставился на то место,
     * где он был в момент деактивации окна страницы.
     * Поэтому в данном случае мы игнорируем первоначально вызванный onFocusOut,
     * в котором нам покажется, что человек сделал Tab и вышел за пределы focusRoot
     */
    if (!isTopTrap()) return
    if (event.relatedTarget === null && event.target !== null) {
      isPageBecomeActive = true
    }
  }

  /**
   * event.target - предыдущий сфокусированный элемент
   * event.relatedTarget - текущий сфокусированный элемент
   */
  async function onFocusOut(event: FocusEvent<HTMLElement>) {
    /**
     * Сначала происходит событие onFocusOut, затем фокус переводится на новый элемент.
     * Если мы попытаемся вручную выставить фокус сразу при onFocusOut, не дожидаясь onFocusIn,
     * то наш фокус сразу перетрется
     */
    if (!isTopTrap()) return
    await new Promise((resolve) => {
      window.addEventListener('focusin', resolve, { once: true })
    })
    if (!isTopTrap()) return

    if (isPageBecomeActive) {
      isPageBecomeActive = false
      return
    }

    if (!$focusRoot.value) {
      return
    }

    const focusableElements = getAllFocusableElements($focusRoot.value)

    /**
     * Если значение null, то мы вышли за пределы focusRoot обычным путем - через Tab
     */
    if (event.relatedTarget === null) {
      focusableElements[0].focus()
    }

    /**
     * Если значение существует, но вне focusRoot, то мы вышли за его пределы
     * используя Shift + Tab, то есть в обратном направлении
     */
    if (event.relatedTarget && !$focusRoot.value.contains(event.relatedTarget)) {
      focusableElements.at(-1)?.focus()
    }
  }

  return { onFocusIn, onFocusOut }
}

function getAllFocusableElements(parent: HTMLElement): NonEmptyArray<HTMLElement> {
  const focusableElementsSelectors = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    'div[contenteditable]',
    'iframe',
    'audio',
    'video'
  ]

  const nodeList = parent.querySelectorAll<HTMLElement>(
    `:where(${focusableElementsSelectors.join(',')}):not([disabled])`
  )

  const [firstNode, ...rest] = nodeList
  if (firstNode) {
    return [firstNode, ...rest]
  }

  return [parent]
}
