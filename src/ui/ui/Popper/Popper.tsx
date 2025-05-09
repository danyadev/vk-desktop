import { defineComponent, KeyboardEvent, shallowRef, Teleport, Transition, watch } from 'vue'
import { flip, offset, OffsetOptions, Placement, shift } from '@floating-ui/dom'
import { JSXElement } from 'misc/utils'
import { useFloatingUI } from './useFloatingUI'
import { RenderSlotWithProps } from 'ui/ui/RenderSlotWithProps/RenderSlotWithProps'
import './Popper.css'

type Props = {
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

  watch([isPointingAtTrigger, isPointingAtContent], () => {
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

  const placement = props.placement ?? 'bottom-end'
  const { setTriggerRef, setContentRef } = useFloatingUI({
    placement,
    middleware: [
      offset(props.offset ?? 4),
      shift(),
      flip()
    ]
  })

  const handleEscape = (event: KeyboardEvent) => {
    if (!props.showOnHover && event.key === 'Escape') {
      event.stopPropagation()
      showContent.value = false
    }
  }

  return () => (
    <>
      <RenderSlotWithProps
        ref={setTriggerRef}
        class={showContent.value && 'Popper__trigger--active'}
        onClick={() => (showContent.value = !showContent.value)}
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
  props: ['content', 'placement', 'offset', 'showOnHover', 'closeOnContentClick']
})
