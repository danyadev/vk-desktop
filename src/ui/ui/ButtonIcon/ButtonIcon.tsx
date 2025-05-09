import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { useFocusVisible } from 'hooks'
import { JSXElement } from 'misc/utils'
import { FocusVisible } from 'ui/ui/FocusVisible/FocusVisible'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ButtonIcon.css'

type Props = {
  icon?: JSXElement
  stretched?: boolean
  withHoverBackground?: boolean
  loading?: boolean
  shiftOnClick?: boolean
} & ButtonHTMLAttributes

export const ButtonIcon = defineComponent<Props>((props, { slots }) => {
  const { isFocused, onBlur, onFocus } = useFocusVisible()

  return () => (
    <button
      type="button"
      class={['ButtonIcon', {
        'ButtonIcon--shiftOnClick': props.shiftOnClick,
        'ButtonIcon--stretched': props.stretched,
        'ButtonIcon--hoverBackground': props.withHoverBackground,
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
  props: ['icon', 'stretched', 'withHoverBackground', 'loading', 'shiftOnClick']
})
