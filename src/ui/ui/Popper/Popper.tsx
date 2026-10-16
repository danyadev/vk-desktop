import {
  defineComponent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  shallowRef,
  Teleport,
  Transition,
  watch
} from 'vue'
import { flip, offset, OffsetOptions, Placement, shift } from '@floating-ui/dom'
import { JSXElement } from 'misc/utils'
import { useFloatingUI } from './useFloatingUI'
import { RenderSlotWithProps } from 'ui/ui/RenderSlotWithProps/RenderSlotWithProps'
import './Popper.css'

type Props = {
  trigger?: 'click' | 'contextmenu'
  content: JSXElement
  placement?: Placement
  offset?: OffsetOptions
  showOnHover?: boolean
  closeOnContentClick?: boolean
}

export const Popper = defineComponent<Props>((props, { slots }) => {
  const showContent = shallowRef(false)
  const isPointingAtTrigger = shallowRef(false)
  const isPointingAtContent = shallowRef(false)
  let hideContentTimeout = 0

  watch([isPointingAtTrigger, isPointingAtContent, () => props.showOnHover], () => {
    if (!props.showOnHover) {
      return
    }

    clearTimeout(hideContentTimeout)

    if (isPointingAtTrigger.value || isPointingAtContent.value) {
      showContent.value = true
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

  const isContextMenu = props.trigger === 'contextmenu'
  const placement = props.placement ?? (isContextMenu ? 'bottom-start' : 'bottom-end')

  const { setTriggerRef, setVirtualTrigger, setContentRef } = useFloatingUI({
    placement,
    middleware: [
      offset(props.offset ?? (isContextMenu ? 0 : 4)),
      shift({ padding: 8 }),
      flip()
    ]
  })

  const onTriggerClick = (event: MouseEvent) => {
    if (isContextMenu) {
      if (showContent.value) {
        event.stopImmediatePropagation()
        showContent.value = false
      }
      return
    }

    showContent.value = !showContent.value
  }

  const handleEscape = (event: KeyboardEvent) => {
    if (!props.showOnHover && event.key === 'Escape' && showContent.value) {
      event.stopPropagation()
      showContent.value = false
    }
  }

  const toggleContextMenu = (event: PointerEvent) => {
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

  return () => (
    <>
      <RenderSlotWithProps
        ref={isContextMenu ? undefined : setTriggerRef}
        class={showContent.value && 'Popper__trigger--active'}
        onClickCapture={onTriggerClick}
        onContextmenu={isContextMenu ? toggleContextMenu : undefined}
        onMouseenter={() => (isPointingAtTrigger.value = true)}
        onMouseleave={() => (isPointingAtTrigger.value = false)}
        onKeydown={handleEscape}
      >
        {slots.default?.()}
      </RenderSlotWithProps>

      <Teleport to=".App">
        {showContent.value && !props.showOnHover && (
          <div
            class="Popper__backdrop"
            onClick={() => (showContent.value = false)}
            onContextmenu={() => (showContent.value = false)}
          />
        )}
        <Transition name="Popper-">
          {showContent.value && (
            <div
              ref={setContentRef}
              class={['Popper', `Popper--placement-${placement}`]}
              onClick={() => props.closeOnContentClick && (showContent.value = false)}
              onMouseenter={() => (isPointingAtContent.value = true)}
              onMouseleave={() => (isPointingAtContent.value = false)}
              onKeydown={handleEscape}
            >
              {props.content}
            </div>
          )}
        </Transition>
      </Teleport>
    </>
  )
}, {
  props: ['trigger', 'content', 'placement', 'offset', 'showOnHover', 'closeOnContentClick']
})
