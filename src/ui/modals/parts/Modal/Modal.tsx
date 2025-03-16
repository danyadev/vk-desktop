import { defineComponent } from 'vue'
import { ClassName, JSXElement } from 'misc/utils'
import { ModalBody, ModalFooter, ModalHeader, ModalView } from 'ui/modals/parts'
import './Modal.css'

type Props = {
  /** Открыта ли модалка */
  opened: boolean
  /** Скрыта ли модалка. Не анмаунтит компонент */
  hidden?: boolean
  /** Обработчик закрытия при клике на крестик и бэкграунд */
  onClose: () => void
  /** Убирает темный фон под модалкой */
  noBackdrop?: boolean
  /** Сообщает о фактической смене видимости модалки. См. описание в ModalView */
  onVisibilityChange?: (isVisible: boolean) => void
  /** Заголовок в шапке модалки */
  title: string | JSXElement
  /** Убирает стандартные отступы для контента модалки */
  withoutBodyPadding?: boolean
  /** Класс, который пробрасывается в тело с контентом модалки */
  class?: ClassName
  /** Кнопки в футере модалки */
  buttons?: JSXElement | JSXElement[]
  /** Контент в левой части футера модалки */
  footerLeftContent?: JSXElement
}

export const Modal = defineComponent<Props>((props, { slots }) => {
  return () => (
    <ModalView
      opened={props.opened}
      hidden={props.hidden}
      onClose={props.onClose}
      noBackdrop={props.noBackdrop}
      onVisibilityChange={props.onVisibilityChange}
    >
      <div class="Modal">
        <ModalHeader title={props.title} onClose={props.onClose} />
        <ModalBody withoutPadding={props.withoutBodyPadding} class={props.class}>
          {slots.default?.()}
        </ModalBody>
        {props.buttons && (
          <ModalFooter buttons={props.buttons} leftContent={props.footerLeftContent} />
        )}
      </div>
    </ModalView>
  )
}, {
  props: [
    'opened',
    'hidden',
    'onClose',
    'noBackdrop',
    'onVisibilityChange',
    'title',
    'withoutBodyPadding',
    'class',
    'buttons',
    'footerLeftContent'
  ]
})
