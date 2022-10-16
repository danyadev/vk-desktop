import 'vue'

/**
 * На данный момент тайпинги событий для JSX элементов содержат слишком мало информации.
 * В этом файле пытаемся исправить ситуацию, пока ее не решили сами разработчики:
 * https://github.com/vuejs/core/issues/4098
 * https://github.com/vuejs/core/pull/3370
 */

// type NativeAnimationEvent = AnimationEvent
// type NativeClipboardEvent = ClipboardEvent
// type NativeCompositionEvent = CompositionEvent
// type NativeDragEvent = DragEvent
// type NativeFocusEvent = FocusEvent
// type NativeKeyboardEvent = KeyboardEvent
// type NativeMouseEvent = MouseEvent
// type NativeTouchEvent = TouchEvent
// type NativePointerEvent = PointerEvent
// type NativeTransitionEvent = TransitionEvent
// type NativeUIEvent = UIEvent
// type NativeWheelEvent = WheelEvent

interface SyntheticEvent<T = Element, E = Event> extends Event {
  /** Element that triggered the event */
  target: T & EventTarget
  /** Element that the event listener is attached to */
  currentTarget: T & EventTarget
  nativeEvent: E
}

declare module '@vue/runtime-dom' {
  // Дополняем интерфейсы атрибутов существующих элементов.
  // К сожалению, обновить типы напрямую в интерфейсе Events невозможно, потому что тайпскрипт
  // запрещает перезаписывать существующие свойства, а ts-ignore не помогает

  interface InputHTMLAttributes {
    onInput?: (event: InputEvent<HTMLInputElement>) => void
  }

  // Декларируем интерфейсы внутри модуля, чтобы была возможность импортировать их в коде

  interface InputEvent<T = Element> extends SyntheticEvent<T> {
    target: EventTarget & T
  }

  // interface ClipboardEvent<T = Element> extends SyntheticEvent<T, NativeClipboardEvent> {
  //   clipboardData: DataTransfer
  // }
  //
  // interface CompositionEvent<T = Element> extends SyntheticEvent<T, NativeCompositionEvent> {
  //   data: string
  // }
  //
  // interface DragEvent<T = Element> extends MouseEvent<T, NativeDragEvent> {
  //   dataTransfer: DataTransfer
  // }
  //
  // interface PointerEvent<T = Element> extends MouseEvent<T, NativePointerEvent> {
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
  // interface FocusEvent<T = Element> extends SyntheticEvent<T, NativeFocusEvent> {
  //   relatedTarget: EventTarget | null
  //   target: EventTarget & T
  // }
  //
  // interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  //
  // interface InvalidEvent<T = Element> extends SyntheticEvent<T> {
  //   target: EventTarget & T
  // }
  //
  // interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
  //   target: EventTarget & T
  // }
  //
  // interface KeyboardEvent<T = Element> extends SyntheticEvent<T, NativeKeyboardEvent> {
  //   altKey: boolean
  //   /** @deprecated */
  //   charCode: number
  //   ctrlKey: boolean
  //   code: string
  //   /**
  //    * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier)
  //    * for a list of valid (case-sensitive) arguments to this method
  //    */
  //   getModifierState(key: string): boolean
  //   /**
  //    * See the [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#named-key-attribute-values)
  //    * for possible values
  //    */
  //   key: string
  //   /** @deprecated */
  //   keyCode: number
  //   locale: string
  //   location: number
  //   metaKey: boolean
  //   repeat: boolean
  //   shiftKey: boolean
  //   /** @deprecated */
  //   which: number
  // }
  //
  // interface MouseEvent<T = Element, E = NativeMouseEvent> extends UIEvent<T, E> {
  //   altKey: boolean
  //   button: number
  //   buttons: number
  //   clientX: number
  //   clientY: number
  //   ctrlKey: boolean
  //   /**
  //    * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier)
  //    * for a list of valid (case-sensitive) arguments to this method.
  //    */
  //   getModifierState(key: string): boolean
  //   metaKey: boolean
  //   movementX: number
  //   movementY: number
  //   pageX: number
  //   pageY: number
  //   relatedTarget: EventTarget | null
  //   screenX: number
  //   screenY: number
  //   shiftKey: boolean
  // }
  //
  // interface TouchEvent<T = Element> extends UIEvent<T, NativeTouchEvent> {
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
  //
  // interface UIEvent<T = Element, E = NativeUIEvent> extends SyntheticEvent<T, E> {
  //   detail: number
  //   view: Window
  // }
  //
  // interface WheelEvent<T = Element> extends MouseEvent<T, NativeWheelEvent> {
  //   deltaMode: number
  //   deltaX: number
  //   deltaY: number
  //   deltaZ: number
  // }
  //
  // interface AnimationEvent<T = Element> extends SyntheticEvent<T, NativeAnimationEvent> {
  //   animationName: string
  //   elapsedTime: number
  //   pseudoElement: string
  // }
  //
  // interface TransitionEvent<T = Element> extends SyntheticEvent<T, NativeTransitionEvent> {
  //   elapsedTime: number
  //   propertyName: string
  //   pseudoElement: string
  // }
}
