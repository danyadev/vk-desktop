import { defineComponent, Ref } from 'vue'
import { ClassName, JSXElement } from 'misc/utils'
import { ModalBody, ModalFooter, ModalHeader, ModalView } from 'ui/modals/parts'

type Props = {
  /** Открыта ли модалка */
  opened: Ref<boolean> | boolean
  /** Скрыта ли модалка. Не анмаунтит компонент */
  hidden?: Ref<boolean> | boolean
  /** Обработчик закрытия при клике на крестик и бэкграунд */
  onClose: () => void
  /** Убирает темный фон под модалкой */
  noBackdrop?: boolean
  /** Сообщает о фактической смене видимости модалки. См. описание в ModalView */
  onVisibilityChange?: (isVisible: boolean) => void
  /** Заголовок в шапке модалки */
  title: string | JSXElement
  /** Убирает стандартные отступы для контента модалки */
  withCustomLayout?: boolean
  /** Класс, который пробрасывается во враппер контента модалки */
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
}, {
  props: [
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
})
