import { ComponentPublicInstance, defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import './Floating.css'

type Props = {
  setReference: (element: Element | ComponentPublicInstance | null) => void
  setFloating: (element: Element | ComponentPublicInstance | null) => void
  button: JSXElement
  showContent?: boolean
  hover?: boolean
}

export const Floating = defineComponent<Props>((props, { slots }) => {
  const { showContent = false, hover = true } = props

  return () => {
    return (
      <>
        <div ref={props.setReference} class="Floating__Reference">{props.button}</div>
        <div
          ref={props.setFloating}
          class={['Floating__content', {
            'Floating__content--hoverEffect': hover
          }]}
        >
          {!showContent && slots.default?.()}
        </div>
      </>
    )
  }
}, {
  props: ['button', 'setReference', 'setFloating', 'showContent', 'hover']
})
