import { FocusEvent, Ref } from 'vue'

export function useFocusTrap($focusRoot: Ref<HTMLElement | null>) {
  let isPageBecomeActive = false

  /**
   * event.relatedTarget - предыдущий сфокусированный элемент
   * event.target - текущий сфокусированный элемент
   */
  function onFocusIn(event: FocusEvent<HTMLElement>) {
    /**
     * Произошла активация окна страницы, фокус автоматически выставился на то место,
     * где он был в момент деактивации окна страницы.
     * Поэтому в данном случае мы игнорируем последующий onFocusOut, в котором нам покажется,
     * что человек сделал Tab и вышел за пределы focusRoot
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
      focusableElements[0]?.focus()
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

function getAllFocusableElements(parent: HTMLElement): HTMLElement[] {
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

  const nodeList = parent.querySelectorAll(
    `:where(${focusableElementsSelectors.join(',')}):not([disabled])`
  )

  return [].slice.call(nodeList)
}