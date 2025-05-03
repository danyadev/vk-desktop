/**
 * На данный момент тайпинги событий для JSX элементов содержат слишком мало информации.
 * В этом файле пытаемся исправить ситуацию, пока ее не решили сами разработчики:
 * https://github.com/vuejs/core/issues/4098
 * https://github.com/vuejs/core/pull/3370
 */

interface SyntheticEvent<T = Element> extends Event {
  /** Элемент, который инициировал событие */
  target: T & EventTarget
  /** Элемент, к которому был добавлен листенер */
  currentTarget: T & EventTarget
}

interface UIEvent<T = Element> extends SyntheticEvent<T> {
  detail: number
  view: Window
}

declare module 'vue' {
  /**
   * Дополняем интерфейсы атрибутов существующих элементов.
   * К сожалению, обновить типы напрямую в интерфейсе Events невозможно, потому что тайпскрипт
   * запрещает перезаписывать существующие свойства, а ts-ignore не помогает
   */

  interface HTMLAttributes {
    onInput?: (event: InputEvent<HTMLElement>) => void
    onKeydown?: (event: KeyboardEvent<HTMLElement>) => void
    onFocusin?: (event: FocusEvent<HTMLElement>) => void
    onFocusout?: (event: FocusEvent<HTMLElement>) => void
    onMousedown?: (event: MouseEvent<HTMLElement>) => void
    onMouseenter?: (event: MouseEvent<HTMLElement>) => void
    onMouseleave?: (event: MouseEvent<HTMLElement>) => void
    onClick?: (event: MouseEvent<HTMLElement>) => void
    onScrollPassive?: (event: Event) => void
  }

  interface InputHTMLAttributes {
    onKeydown?: (event: KeyboardEvent<HTMLInputElement>) => void
    onChange?: (event: InputEvent<HTMLInputElement>) => void
    onInput?: (event: InputEvent<HTMLInputElement>) => void
  }

  /**
   * Декларируем типы внутри модуля, чтобы была возможность импортировать их в коде
   */

  type InputEvent<T = Element> = SyntheticEvent<T>

  interface KeyboardEvent<T = Element> extends SyntheticEvent<T> {
    altKey: boolean
    /** @deprecated */
    charCode: number
    ctrlKey: boolean
    code: string
    getModifierState: (key: string) => boolean
    key: string
    /** @deprecated */
    keyCode: number
    locale: string
    location: number
    metaKey: boolean
    repeat: boolean
    shiftKey: boolean
    /** @deprecated */
    which: number
  }

  interface FocusEvent<T = Element> extends SyntheticEvent<T> {
    currentTarget: null
    relatedTarget: T & EventTarget | null
  }

  // interface ClipboardEvent<T = Element> extends SyntheticEvent<T> {
  //   clipboardData: DataTransfer
  // }
  //
  // interface CompositionEvent<T = Element> extends SyntheticEvent<T> {
  //   data: string
  // }
  //
  // interface DragEvent<T = Element> extends MouseEvent<T> {
  //   dataTransfer: DataTransfer
  // }
  //
  // interface PointerEvent<T = Element> extends MouseEvent<T> {
  //   pointerId: number
  //   pressure: number
  //   tangentialPressure: number
  //   tiltX: number
  //   tiltY: number
  //   twist: number
  //   width: number
  //   height: number
  //   pointerType: 'mouse' | 'pen' | 'touch'
  //   isPrimary: boolean
  // }
  //
  // interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  //
  // interface InvalidEvent<T = Element> extends SyntheticEvent<T> {
  //   target: EventTarget & T
  // }

  interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: T & EventTarget
  }

  interface MouseEvent<T = Element> extends UIEvent<T> {
    altKey: boolean
    button: number
    buttons: number
    clientX: number
    clientY: number
    ctrlKey: boolean
    getModifierState(key: string): boolean
    metaKey: boolean
    movementX: number
    movementY: number
    pageX: number
    pageY: number
    relatedTarget: EventTarget | null
    screenX: number
    screenY: number
    shiftKey: boolean
  }

  // interface TouchEvent<T = Element> extends UIEvent<T> {
  //   altKey: boolean
  //   changedTouches: TouchList
  //   ctrlKey: boolean
  //   /**
  //    * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier)
  //    * for a list of valid (case-sensitive) arguments to this method
  //    */
  //   getModifierState(key: string): boolean
  //   metaKey: boolean
  //   shiftKey: boolean
  //   targetTouches: TouchList
  //   touches: TouchList
  // }

  // interface WheelEvent<T = Element> extends MouseEvent<T> {
  //   deltaMode: number
  //   deltaX: number
  //   deltaY: number
  //   deltaZ: number
  // }
  //
  // interface AnimationEvent<T = Element> extends SyntheticEvent<T> {
  //   animationName: string
  //   elapsedTime: number
  //   pseudoElement: string
  // }
  //
  // interface TransitionEvent<T = Element> extends SyntheticEvent<T> {
  //   elapsedTime: number
  //   propertyName: string
  //   pseudoElement: string
  // }
}

export {}
