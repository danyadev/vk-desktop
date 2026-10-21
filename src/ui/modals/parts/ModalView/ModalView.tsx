import { computed, defineComponent, shallowRef, Teleport, Transition } from 'vue'
import { useFocusTrap, useIsMounted } from 'hooks'
import { ClassName } from 'misc/utils'
import './ModalView.css'

type Props = {
  /** Открыта ли модалка */
  opened: boolean
  /** Скрыта ли модалка. Не анмаунтит компонент */
  hidden?: boolean
  /** Обработчик закрытия при клике на крестик и бэкграунд */
  onClose: () => void
  /**
   * Функция, сообщающая о смене актуальной видимости модалки.
   * isVisible = true выставляется перед началом анимации появления модалки
   * isVisible = false выставляется после окончания анимации скрытия модалки
   *
   * Схема работы:
   * <opened = true> -> <isVisible = true> -> [анимация появления модалки]
   * <opened = false> -> [анимация скрытия модалки] -> <isVisible = false>
   */
  onVisibilityChange?: (isVisible: boolean) => void
  /** Убирает темный фон под модалкой */
  noBackdrop?: boolean
  class?: ClassName
}

export const ModalView = defineComponent<Props>((props, { slots }) => {
  const isMounted = useIsMounted()
  const isModalVisible = shallowRef(false)

  function onBeforeAppear() {
    isModalVisible.value = true
    props.onVisibilityChange?.(true)
  }

  function onAfterLeave() {
    /**
     * Если на этот момент модалка в открытом состоянии, то это означает,
     * что она была повторно открыта до момента окончания текущей анимации закрытия.
     * (см. схему в описании поля onVisibilityChange)
     *
     * Пропускаем установку видимости в false, чтобы у модалки, которая в данный момент
     * собирается открыться, не было неправильного состояния <opened = true> и <visible = false>,
     * когда на самом деле модалка видна.
     * Иначе при закрытии этой модалки не произойдет анимации закрытия
     */
    if (props.opened) {
      return
    }

    isModalVisible.value = false
    props.onVisibilityChange?.(false)
  }

  return () => {
    /**
     * Телепортом можно пользоваться только когда элемент назначения (ModalsContainer)
     * уже примонтирован
     *
     * Сам по себе рендер после монтирования должен происходить очень быстро
     * + мал шанс того, что модалка должна быть открыта сразу же
     * + из-за наличия анимации при открытии модалки возможная видимая задержка сходит на нет
     */
    if (!isMounted.value) {
      return null
    }

    /**
     * Рендерим телепорт с модалкой только когда модалка открыта,
     * либо когда анимация закрытия еще не завершилась
     *
     * Это нужно, чтобы в контейнере, куда телепортируется контент, модалки располагались
     * в порядке их открытия, а не в порядке инициализации компонента с opened={false}
     */
    if (!props.opened && !isModalVisible.value) {
      return null
    }

    return (
      <Teleport to=".ModalsContainer">
        <Transition
          name="ModalViewAnimation"
          appear
          onBeforeAppear={onBeforeAppear}
          onAfterLeave={onAfterLeave}
        >
          {props.opened && <View {...props}>{slots.default?.()}</View>}
        </Transition>
      </Teleport>
    )
  }
}, {
  props: ['opened', 'hidden', 'onClose', 'onVisibilityChange', 'noBackdrop', 'class']
})

const View = defineComponent<Props>((props, { slots }) => {
  const $modalContainer = shallowRef<HTMLElement | null>(null)
  const { onFocusIn, onFocusOut } = useFocusTrap($modalContainer, computed(() => !props.hidden))

  return () => (
    <div
      class={['ModalView', {
        'ModalView--hidden': props.hidden,
        'ModalView--noBackdrop': props.noBackdrop
      }]}
    >
      <div class="ModalView__backdrop" onClick={props.onClose} />
      <div
        class={['ModalView__container', props.class]}
        tabindex="-1"
        onKeydown={(event) => event.key === 'Escape' && props.onClose()}
        onFocusin={onFocusIn}
        onFocusout={onFocusOut}
        ref={$modalContainer}
      >
        {slots.default?.()}
      </div>
    </div>
  )
}, {
  props: ['hidden', 'onClose', 'noBackdrop', 'class']
})
