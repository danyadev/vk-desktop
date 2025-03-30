import { FocusEvent, onBeforeMount, onUnmounted, Ref } from 'vue'
import { NonEmptyArray } from 'misc/utils'

/**
 * Храним количество активных фокус трапов, чтобы задерживать фокус только
 * для последнего вызванного хука, так как сфокусированный элемент может быть только один
 */
let lastTrapIndex = 0

export function useFocusTrap($focusRoot: Ref<HTMLElement | null>) {
  let initialFocusedElement: Element | null = null
  let isPageBecomeActive = false
  const currentTrapIndex = ++lastTrapIndex

  onBeforeMount(() => {
    initialFocusedElement = document.activeElement
  })

  onUnmounted(() => {
    if (initialFocusedElement instanceof HTMLElement) {
      initialFocusedElement.focus()
    }
    lastTrapIndex--
  })

  /**
   * event.relatedTarget - предыдущий сфокусированный элемент
   * event.target - текущий сфокусированный элемент
   */
  function onFocusIn(event: FocusEvent<HTMLElement>) {
    if (currentTrapIndex !== lastTrapIndex) {
      return
    }

    /**
     * Произошла активация окна страницы, фокус автоматически выставился на то место,
     * где он был в момент деактивации окна страницы.
     * Поэтому в данном случае мы игнорируем первоначально вызванный onFocusOut,
     * в котором нам покажется, что человек сделал Tab и вышел за пределы focusRoot
     */
    if (event.relatedTarget === null && event.target !== null) {
      isPageBecomeActive = true
    }
  }

  /**
   * event.target - предыдущий сфокусированный элемент
   * event.relatedTarget - текущий сфокусированный элемент
   */
  async function onFocusOut(event: FocusEvent<HTMLElement>) {
    if (currentTrapIndex !== lastTrapIndex) {
      return
    }

    /**
     * Сначала происходит событие onFocusOut, затем фокус переводится на новый элемент.
     * Если мы попытаемся вручную выставить фокус сразу при onFocusOut, не дожидаясь onFocusIn,
     * то наш фокус сразу перетрется
     */
    await new Promise((resolve) => {
      window.addEventListener('focusin', resolve, { once: true })
    })

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
