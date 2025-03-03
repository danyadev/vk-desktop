import { ComponentPublicInstance, defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import './Floating.css'

type Props = {
  setReference: (element: Element | ComponentPublicInstance | null) => void
  setFloating: (element: Element | ComponentPublicInstance | null) => void
  showContent: boolean
  button: JSXElement
}

export const Floating = defineComponent<Props>((props, { slots }) => {
  return () => {
    return (
      <>
        <div ref={props.setReference} class="Floating__Reference">{props.button}</div>
        <div ref={props.setFloating} class="Floating__content">
          {!props.showContent && slots.default?.()}
        </div>
      </>
    )
  }
}, {
  props: ['button', 'setReference', 'setFloating', 'showContent']
})
