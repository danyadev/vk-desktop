import { defineComponent, HTMLAttributes, shallowRef, Teleport, Transition, watch } from 'vue'
import { flip, offset, Placement, shift } from '@floating-ui/dom'
import { JSXElement } from 'misc/utils'
import { useFloatingUI } from './useFloatingUI'
import './Popover.css'

type Props = {
  content: JSXElement
  placement?: Placement
  showOnHover?: boolean
  closeOnContentClick?: boolean
}

export const Popover = defineComponent<Props>((props, { slots }) => {
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
    } else {
      hideContentTimeout = window.setTimeout(() => {
        showContent.value = false
      }, 250)
    }
  })

  const placement = props.placement ?? 'bottom-end'
  const { setTriggerRef, setContentRef } = useFloatingUI({
    placement,
    middleware: [
      offset(4),
      shift(),
      flip()
    ]
  })

  return () => (
    <>
      <RenderSlotWithRef
        ref={setTriggerRef}
        class={showContent.value && 'Popover__trigger--active'}
        onClick={() => (showContent.value = !showContent.value)}
        onMouseenter={() => (isPointingAtTrigger.value = true)}
        onMouseleave={() => (isPointingAtTrigger.value = false)}
      >
        {slots.default?.()}
      </RenderSlotWithRef>

      <Teleport to=".App">
        {showContent.value && !props.showOnHover && (
          <div
            class="Popover__backdrop"
            onClick={() => (showContent.value = false)}
          />
        )}
        <Transition name="Popover-">
          {showContent.value && (
            <div
              ref={setContentRef}
              class={['Popover', `Popover--placement-${placement}`]}
              onClick={() => props.closeOnContentClick && (showContent.value = false)}
              onMouseenter={() => (isPointingAtContent.value = true)}
              onMouseleave={() => (isPointingAtContent.value = false)}
            >
              {props.content}
            </div>
          )}
        </Transition>
      </Teleport>
    </>
  )
}, {
  props: ['content', 'placement', 'showOnHover', 'closeOnContentClick']
})

const RenderSlotWithRef = defineComponent<HTMLAttributes>((props, { slots }) => {
  return () => {
    /**
     * Слот это всегда массив или undefined. Не знаю почему массив, там всегда один элемент.
     *
     * Этот один элемент это всегда фрагмент, поэтому мы сначала достаем его.
     *
     * А вот дети у фрагмента это как раз массив элементов, которые и были переданы в качестве
     * детей компоненту.
     * Важно: дети могут быть так же фрагментами или компонентами, которые начинаются с
     * фрагмента, и в таком случае реф будет на фрагменте, а не на нужном элементе,
     * а такого не следует допускать.
     *
     * Проблема в том, что если поставить реф на фрагмент, он будет указывать на пустую text ноду,
     * находящуюся перед содержимым фрагмента, а оно может быть как пустое, так и с несколькими
     * элементами, количество которых мы не знаем, что делает невозможным какое-либо взаимодействие
     * с этой пустой text нодой
     */
    const [fragment] = slots.default?.() ?? []

    if (!fragment || !Array.isArray(fragment.children)) {
      return fragment
    }

    if (fragment.children.length > 1) {
      throw new Error('RenderSlotWithRef expected 1 child, got: ' + fragment.children.length)
    }

    return fragment.children[0]
  }
})
