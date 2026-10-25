import {
  computed,
  defineComponent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  shallowRef,
  Teleport,
  Transition,
  VNodeChild,
  watch,
  watchEffect
} from 'vue'
import { flip, offset, OffsetOptions, Placement, shift } from '@floating-ui/dom'
import { useFocusTrap } from 'hooks'
import { JSXElement, RawRefElement, unrefElement } from 'misc/utils'
import { useFloatingUI } from './useFloatingUI'
import { RenderSlotWithProps } from 'ui/ui/RenderSlotWithProps/RenderSlotWithProps'
import './Popper.css'

type Props = {
  trigger?: 'click' | 'contextmenu'
  content: JSXElement | VNodeChild
  placement?: Placement
  offset?: OffsetOptions
  showOnHover?: boolean
  withDelayOnHoverOpen?: boolean
  closeOnContentClick?: boolean
  disabled?: boolean
  nested?: boolean
}

export const Popper = defineComponent<Props>((props, { slots }) => {
  const $popper = shallowRef<HTMLElement | null>(null)
  const showContent = shallowRef(false)
  const isVisible = shallowRef(false)
  const isPointingAtTrigger = shallowRef(false)
  const isPointingAtContent = shallowRef(false)
  const isContextMenu = props.trigger === 'contextmenu'
  let hideContentTimeout = 0
  let showContentTimeout = 0

  watchEffect((onCleanup) => {
    if (!props.showOnHover) return

    onCleanup(() => {
      clearTimeout(showContentTimeout)
      clearTimeout(hideContentTimeout)
    })

    if (props.disabled) {
      showContent.value = false
    } else if (showContent.value && (isPointingAtContent.value || isPointingAtTrigger.value)) {
      // keep showContent
    } else if (isPointingAtTrigger.value) {
      if (props.withDelayOnHoverOpen) {
        showContentTimeout = window.setTimeout(() => {
          showContent.value = true
        }, 250)
      } else {
        showContent.value = true
      }
    } else if (showContent.value) {
      hideContentTimeout = window.setTimeout(() => {
        showContent.value = false
      }, 250)
    }
  })

  watch(showContent, () => {
    if (isContextMenu && !showContent.value) {
      setVirtualTrigger(null)
    }
  })

  const { setTriggerRef, setVirtualTrigger, setContentRef, effectivePlacement } = useFloatingUI({
    placement: props.placement ?? (isContextMenu ? 'bottom-start' : 'bottom-end'),
    middleware: [
      offset(props.offset ?? (isContextMenu ? 0 : 4)),
      flip({ padding: 8, fallbackAxisSideDirection: 'end' }),
      shift({ padding: 8 })
    ]
  })

  const { onFocusIn, onFocusOut } = useFocusTrap($popper, computed(() => (
    showContent.value && !props.nested && !props.showOnHover
  )))

  const setPopperRef = (element: RawRefElement) => {
    const node = unrefElement(element)
    if (!node || node instanceof HTMLElement) {
      $popper.value = node
      setContentRef(node)
    }
  }

  const onTriggerClick = (event: MouseEvent) => {
    if (props.disabled) {
      return
    }
    if (isContextMenu) {
      if (showContent.value) {
        event.stopImmediatePropagation()
        showContent.value = false
      }
      return
    }

    showContent.value = !showContent.value
  }

  const onContextMenu = (event: PointerEvent) => {
    if (props.disabled) {
      return
    }

    event.preventDefault()

    if (showContent.value) {
      showContent.value = false
      return
    }

    const { clientX, clientY } = event
    setVirtualTrigger({
      getBoundingClientRect: () => new DOMRect(clientX, clientY, 0, 0),
      contextElement: event.currentTarget
    })

    showContent.value = true
  }

  const handleEscape = (event: KeyboardEvent) => {
    if (!props.showOnHover && event.key === 'Escape' && showContent.value) {
      event.stopPropagation()
      showContent.value = false
    }
  }

  const onBeforeAppear = () => {
    isVisible.value = true
  }

  const onAfterLeave = () => {
    if (!showContent.value) {
      isVisible.value = false
    }
  }

  return () => (
    <>
      <RenderSlotWithProps
        ref={isContextMenu ? undefined : setTriggerRef}
        class={showContent.value && 'Popper__trigger--active'}
        onClickCapture={onTriggerClick}
        onContextmenu={isContextMenu ? onContextMenu : undefined}
        onMouseenter={() => (isPointingAtTrigger.value = true)}
        onMouseleave={() => (isPointingAtTrigger.value = false)}
        onKeydown={handleEscape}
      >
        {slots.default?.()}
      </RenderSlotWithProps>

      {(showContent.value || isVisible.value) && (
        <Teleport to=".App" disabled={props.nested}>
          {showContent.value && !props.showOnHover && (
            <div
              class="Popper__backdrop"
              onClick={() => (showContent.value = false)}
              onContextmenu={() => (showContent.value = false)}
            />
          )}

          <Transition
            name="Popper-"
            appear
            onBeforeAppear={onBeforeAppear}
            onAfterLeave={onAfterLeave}
          >
            {showContent.value && (
              <div
                ref={setPopperRef}
                class={['Popper', `Popper--placement-${effectivePlacement.value}`]}
                tabindex={-1}
                onClick={() => props.closeOnContentClick && (showContent.value = false)}
                onMouseenter={() => (isPointingAtContent.value = true)}
                onMouseleave={() => (isPointingAtContent.value = false)}
                onKeydown={handleEscape}
                onFocusin={onFocusIn}
                onFocusout={onFocusOut}
              >
                {props.content}
              </div>
            )}
          </Transition>
        </Teleport>
      )}
    </>
  )
}, {
  props: [
    'trigger',
    'content',
    'placement',
    'offset',
    'showOnHover',
    'withDelayOnHoverOpen',
    'closeOnContentClick',
    'disabled',
    'nested'
  ]
})
