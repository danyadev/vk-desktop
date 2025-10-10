import { defineComponent, onMounted, onUpdated, shallowRef, Transition } from 'vue'
import { useResizeObserver } from 'hooks'
import { ClassName, throttle } from 'misc/utils'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon16ChevronRight, Icon24ChevronRight } from 'assets/icons'
import './HorizontalScroll.css'

type Props = {
  size?: 'small' | 'normal'
  innerClass?: ClassName
}

export const HorizontalScroll = defineComponent<Props>((props, { slots }) => {
  const $innerElement = shallowRef<HTMLElement | null>(null)
  const canScrollLeft = shallowRef(false)
  const canScrollRight = shallowRef(false)

  onMounted(() => calculateArrowsVisibility())
  // Хук вызывается при рендере как этого компонента, так и всех его детей
  onUpdated(() => calculateArrowsVisibility())
  useResizeObserver($innerElement, () => calculateArrowsVisibility())

  const calculateArrowsVisibility = () => {
    const innerElement = $innerElement.value
    if (!innerElement) {
      return
    }

    const distanceFromRight =
      innerElement.scrollWidth - innerElement.scrollLeft - innerElement.clientWidth

    canScrollLeft.value = innerElement.scrollLeft > 2
    canScrollRight.value = distanceFromRight > 2
  }

  const scrollToSide = (side: 'left' | 'right') => {
    const innerElement = $innerElement.value
    if (!innerElement) {
      return
    }

    // Скроллим на ширину видимого контента
    const amount = innerElement.offsetWidth * 0.9
    innerElement.scrollBy({
      left: side === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
  }

  const onWheel = (event: WheelEvent) => {
    const innerElement = $innerElement.value
    if (innerElement && !event.deltaX && !event.shiftKey) {
      // Скроллим то же расстояние горизонтально, которое юзер попытался проскроллить вертикально.
      // К сожалению без плавности, так как череда прокрутки колесиком замедляется анимацией
      const amount = Math.min(Math.abs(event.deltaY), innerElement.offsetWidth * 0.9)
      innerElement.scrollBy({
        left: Math.sign(event.deltaY) * amount,
        behavior: 'instant'
      })
    }
  }

  const onScroll = throttle(calculateArrowsVisibility, 50)

  return () => (
    <div class={['HorizontalScroll', props.size === 'small' && 'HorizontalScroll--small']}>
      <Transition name="HorizontalScroll__button-">
        {canScrollLeft.value && (
          <ButtonIcon
            class="HorizontalScroll__leftButton"
            icon={props.size === 'small' ? <Icon16ChevronRight /> : <Icon24ChevronRight />}
            onClick={() => scrollToSide('left')}
          />
        )}
      </Transition>

      <div
        class={['HorizontalScroll__in', props.innerClass]}
        ref={$innerElement}
        onWheelPassive={onWheel}
        onScrollPassive={onScroll}
      >
        {slots.default?.()}
      </div>

      <Transition name="HorizontalScroll__button-">
        {canScrollRight.value && (
          <ButtonIcon
            class="HorizontalScroll__rightButton"
            icon={props.size === 'small' ? <Icon16ChevronRight /> : <Icon24ChevronRight />}
            onClick={() => scrollToSide('right')}
          />
        )}
      </Transition>
    </div>
  )
}, {
  props: ['size', 'innerClass']
})
