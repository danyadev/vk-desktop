import { onScopeDispose, Ref } from 'vue'
import { createSharedComposable, getMapValueOrCompute } from 'misc/utils'
import { hasActiveFocusTrap } from './useFocusTrap'

type ZoneName = 'messenger' | 'convoList' | 'convoView'
type KeyboardHandler = (event: KeyboardEvent) => boolean | undefined

export const useKeyboardZones = createSharedComposable(() => {
  const zones = new Map<ZoneName, Ref<HTMLElement | null>>()
  const handlers = new Map<ZoneName, Set<KeyboardHandler>>()
  let lastFocusedZones: ZoneName[] = []

  const findZones = (element: Node) => [...zones.entries()]
    .filter(([, root]) => root.value?.contains(element))
    .sort((a, b) => (a[1].value!.contains(b[1].value) ? 1 : -1))
    .map(([name]) => name)

  const restoreZoneFocus = () => {
    if (document.activeElement !== document.body || !document.hasFocus()) return
    if (hasActiveFocusTrap()) return

    const candidates = new Set([...lastFocusedZones, ...zones.keys()])
    for (const name of candidates) {
      const root = zones.get(name)?.value
      if (!root?.isConnected) continue

      root.focus({ preventScroll: true })
      return
    }
  }

  const onFocusIn = (event: FocusEvent) => {
    if (!(event.target instanceof Node)) return

    const focusedZones = findZones(event.target)
    if (focusedZones.length > 0) lastFocusedZones = focusedZones
  }

  const onFocusOut = (event: FocusEvent) => {
    if (!(event.target instanceof Node)) return
    if (findZones(event.target).length === 0) return
    // Restore focus only when it was lost, not when it moved to another element
    if (event.relatedTarget !== null && event.relatedTarget !== document.body) return

    // Restore after the browser completes the focus transition
    queueMicrotask(restoreZoneFocus)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (hasActiveFocusTrap()) return
    if (!(event.target instanceof Node)) return

    for (const name of findZones(event.target)) {
      for (const handler of handlers.get(name) ?? []) {
        if (handler(event) === true) return
      }
    }
  }

  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
  document.addEventListener('keydown', onKeyDown)
  onScopeDispose(() => {
    document.removeEventListener('focusin', onFocusIn)
    document.removeEventListener('focusout', onFocusOut)
    document.removeEventListener('keydown', onKeyDown)
  })

  /**
   * Note: zone roots are expected to be focusable, consider adding tabindex={-1} when necessary
   */
  const registerZone = (name: ZoneName, root: Ref<HTMLElement | null>) => {
    zones.set(name, root)
    onScopeDispose(() => {
      if (zones.get(name) === root) zones.delete(name)
    })
  }

  const registerZoneHandler = (name: ZoneName, handler: KeyboardHandler) => {
    const zoneHandlers = getMapValueOrCompute(handlers, name, () => new Set<KeyboardHandler>())
    zoneHandlers.add(handler)
    onScopeDispose(() => {
      zoneHandlers.delete(handler)
    })
  }

  return { registerZone, registerZoneHandler }
})
