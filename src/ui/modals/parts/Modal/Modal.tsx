import { defineComponent, Ref } from 'vue'
import { ModalBody, ModalFooter, ModalHeader, ModalView } from 'ui/modals/parts'
import { JSXElement } from 'misc/utils'

type Props = {
  /** Открыта ли модалка */
  opened: Ref<boolean> | boolean
  /** Скрыта ли модалка. Не анмаунтит компонент */
  hidden?: Ref<boolean> | boolean
  /** Обработчик закрытия при клике на крестик и бэкграунд */
  onClose: () => void
  /** Убирает темный фон под модалкой */
  noBackdrop?: boolean
  /** Заголовок в шапке модалки */
  title: string | JSXElement
  /** Убирает стандартные отступы для контента модалки */
  withCustomLayout?: boolean
  /** Класс, который пробрасывается во враппер контента модалки */
  class?: string
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
    >
      <ModalHeader title={props.title} onClose={props.onClose} />
      <ModalBody
        withCustomLayout={props.withCustomLayout}
        class={props.class}
      >
        {slots.default?.()}
      </ModalBody>
      {props.buttons && (
        <ModalFooter buttons={props.buttons} leftContent={props.footerLeftContent} />
      )}
    </ModalView>
  )
})

Modal.props = [
  'opened',
  'hidden',
  'onClose',
  'noBackdrop',
  'title',
  'withCustomLayout',
  'class',
  'buttons',
  'footerLeftContent'
]