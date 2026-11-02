import {
  defineComponent,
  HTMLAttributes,
  nextTick,
  onBeforeUnmount,
  onBeforeUpdate,
  onUpdated,
  shallowRef,
  Transition
} from 'vue'
import './AutoHeightTransition.css'

type Props = {
  /** Where content remains anchored during height changes */
  anchor: 'top' | 'center' | 'bottom'
  /** Animate only when this key changes instead of vue key */
  triggerKey?: string | number
} & HTMLAttributes

export const AutoHeightTransition = defineComponent<Props>((props, { slots }) => {
  const $container = shallowRef<HTMLElement | null>(null)

  let previousHeight: number | undefined
  let previousKey = props.triggerKey
  let animation: Animation | undefined

  const captureHeight = () => {
    const container = $container.value
    if (!container) return

    previousHeight = container.getBoundingClientRect().height
    animation?.cancel()
    animation = undefined
  }

  const animateHeight = () => {
    const from = previousHeight
    previousHeight = undefined

    const container = $container.value
    if (!container || from === undefined) return

    const to = container.getBoundingClientRect().height
    if (Math.abs(from - to) < 1) return

    const next = container.animate([
      { height: `${from}px` },
      { height: `${to}px` }
    ], { duration: 150, easing: 'ease-in-out' })

    animation = next
    next.onfinish = () => {
      if (animation === next) animation = undefined
    }
  }

  const onTransition = async () => {
    await nextTick()
    animateHeight()
  }

  const onBeforeEnter = () => {
    if (previousHeight === undefined) captureHeight()
  }

  onBeforeUpdate(() => {
    if (props.triggerKey === previousKey) return
    previousKey = props.triggerKey
    captureHeight()
  })

  onUpdated(() => {
    if (props.triggerKey !== undefined) animateHeight()
  })

  onBeforeUnmount(() => animation?.cancel())

  return () => (
    <div class={['AutoHeightTransition', `AutoHeightTransition--${props.anchor}`]} ref={$container}>
      {props.triggerKey === undefined ? (
        <Transition
          name="AutoHeightTransition-"
          onBeforeEnter={onBeforeEnter}
          onBeforeLeave={captureHeight}
          onEnter={onTransition}
          onLeave={onTransition}
        >
          {slots.default?.()}
        </Transition>
      ) : slots.default?.()}
    </div>
  )
}, {
  props: ['anchor', 'triggerKey']
})
