import { onBeforeUnmount, Ref, shallowRef, watch } from 'vue'
import { NonEmptyArray } from 'misc/utils'

const activeTraps: symbol[] = []

export const hasActiveFocusTrap = () => activeTraps.length > 0

export function useFocusTrap(
  $focusRoot: Ref<HTMLElement | null>,
  active: Ref<boolean> = shallowRef(true)
) {
  const trapId = Symbol()
  const isTopTrap = () => activeTraps.at(-1) === trapId

  let initialFocusedElement: Element | null = null

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isTopTrap() || event.key !== 'Tab' || event.defaultPrevented) return
    if (event.ctrlKey || event.altKey || event.metaKey) return

    const root = $focusRoot.value
    if (!root) return

    const focusableElements = getAllFocusableElements(root)
    const first = focusableElements[0]
    const last = focusableElements.at(-1)!
    const focused = document.activeElement

    if (event.shiftKey && (focused === first || focused === root)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && focused === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const deactivate = () => {
    const index = activeTraps.indexOf(trapId)
    if (index === -1) return

    /**
     * - If focus is still inside, restore it to the previously focused element.
     * - If focus has fallen back to document.body (e.g. because the focused element
     *   was disabled or removed), restore it as well.
     * - If focus has moved outside the trap, preserve it, since the focus-trapped component
     *   may have deliberately focused another element during closing.
     */
    const shouldRestoreFocus = isTopTrap() && (
      document.activeElement === document.body ||
      $focusRoot.value?.contains(document.activeElement)
    )

    activeTraps.splice(index, 1)

    if (shouldRestoreFocus && initialFocusedElement instanceof HTMLElement) {
      initialFocusedElement.focus()
    }
  }

  watch($focusRoot, (root, prevRoot, onCleanup) => {
    if (!root) return

    root.addEventListener('keydown', onKeyDown)
    onCleanup(() => root.removeEventListener('keydown', onKeyDown))
  }, { immediate: true })

  watch(active, (enabled) => {
    if (enabled) {
      if (activeTraps.includes(trapId)) return

      initialFocusedElement = document.activeElement
      activeTraps.push(trapId)
    } else {
      deactivate()
    }
  }, { immediate: true })

  watch([active, $focusRoot], ([enabled, root]) => {
    if (!enabled || !root || !isTopTrap()) {
      return
    }
    if (!root.contains(document.activeElement)) {
      root.focus()
    }
  }, { immediate: true })

  onBeforeUnmount(deactivate)
}

function getAllFocusableElements(parent: HTMLElement): NonEmptyArray<HTMLElement> {
  const focusableElementsSelectors = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
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
