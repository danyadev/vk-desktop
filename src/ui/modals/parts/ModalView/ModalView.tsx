import './ModalView.css'
import { defineComponent, ref, Ref, Teleport, Transition, unref, watch } from 'vue'
import { useIsMounted } from 'misc/hooks'
import { useFocusTrap } from './useFocusTrap'

type Props = {
  /** Открыта ли модалка */
  opened: Ref<boolean> | boolean
  /** Скрыта ли модалка. Не анмаунтит компонент */
  hidden?: Ref<boolean> | boolean
  /** Обработчик закрытия при клике на крестик и бэкграунд */
  onClose: () => void
  /** Убирает темный фон под модалкой */
  noBackdrop?: boolean
}

export const ModalView = defineComponent<Props>((props, { slots }) => {
  const isMounted = useIsMounted()
  const isModalTransitionLeaved = ref(true)
  const $modalContent = ref<HTMLDivElement | null>(null)
  const { onFocusIn, onFocusOut } = useFocusTrap($modalContent)

  /**
   * Фокусируемся на модалке при ее показе, чтобы сбросить фокус с предыдущего элемента,
   * который теперь находится под модалкой, например кнопки или поля ввода.
   *
   * Это нужно, чтобы случайно не совершать действия, которые не планировалось совершать,
   * например при нажатии на Enter или Escape
   *
   * Ну и чтобы Esc отрабатывал правильно при открытой модалке
   */
  watch($modalContent, () => {
    if (!$modalContent.value) {
      return
    }

    // Если внутри модалки уже есть фокус, то не перебиваем фокус на корень модалки
    if ($modalContent.value.contains(document.activeElement)) {
      return
    }

    $modalContent.value.focus()
  })

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
    if (!unref(props.opened) && isModalTransitionLeaved.value) {
      return null
    }

    return (
      <Teleport to=".ModalsContainer">
        <Transition
          name="ModalViewAnimation"
          appear
          onBeforeAppear={() => (isModalTransitionLeaved.value = false)}
          onAfterLeave={() => (isModalTransitionLeaved.value = true)}
        >
          {unref(props.opened) && (
            <div
              class={['ModalView', {
                'ModalView--hidden': unref(props.hidden),
                'ModalView--noBackdrop': props.noBackdrop
              }]}
            >
              <div class="ModalView__backdrop" onClick={props.onClose} />
              <div class="ModalView__container">
                <div
                  class="ModalView__content"
                  tabindex="-1"
                  onKeydown={(event) => event.key === 'Escape' && props.onClose()}
                  onFocusin={onFocusIn}
                  onFocusout={onFocusOut}
                  ref={$modalContent}
                >
                  {slots.default?.()}
                </div>
              </div>
            </div>
          )}
        </Transition>
      </Teleport>
    )
  }
})

ModalView.props = ['opened', 'hidden', 'onClose', 'noBackdrop']
