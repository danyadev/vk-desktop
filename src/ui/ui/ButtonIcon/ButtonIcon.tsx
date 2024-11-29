import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { useFocusVisible } from 'hooks'
import { JSXElement } from 'misc/utils'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import './ButtonIcon.css'

import { Spinner } from '../Spinner/Spinner'

type Props = {
  icon?: JSXElement
  stretched?: boolean
  addHoverBackground?: boolean
  loading?: boolean
} & ButtonHTMLAttributes

export const ButtonIcon = defineComponent<Props>((props, { slots }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()
  console.log(props.loading)

  return () => (
    <button
      type="button"
      class={['ButtonIcon', {
        'ButtonIcon--stretched': props.stretched,
        'ButtonIcon--hoverBackground': props.addHoverBackground ?? true,
        'ButtonIcon--loading': props.loading
      }]}
      onBlur={onBlur}
      onFocus={onFocus}
    >
      <span class="ButtonIcon__in">
        {props.icon}
        {slots.default?.()}
      </span>
      {props.loading && <Spinner class="ButtonIcon__spinner" color="inherit" />}
      <FocusVisible isFocused={isFocused.value} />
    </button>
  )
}, {
  props: ['icon', 'stretched', 'addHoverBackground', 'loading']
})
