import './ModalView.css'
import { defineComponent, Ref, Teleport, Transition, unref } from 'vue'
import { useIsMounted } from 'misc/hooks'

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

    return (
      <Teleport to=".ModalsContainer">
        <Transition name="ModalViewAnimation">
          {unref(props.opened) && (
            <div
              class={['ModalView', {
                'ModalView--hidden': unref(props.hidden),
                'ModalView--noBackdrop': props.noBackdrop
              }]}
            >
              <div class="ModalView__backdrop" onClick={props.onClose} />
              <div class="ModalView__container">
                <div class="ModalView__content">
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
