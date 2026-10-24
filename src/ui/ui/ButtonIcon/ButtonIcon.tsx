import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import { ButtonBase } from 'ui/ui/ButtonBase/ButtonBase'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ButtonIcon.css'

type Props = {
  icon?: JSXElement
  stretched?: boolean
  withHoverBackground?: boolean
  loading?: boolean
  shiftOnClick?: boolean
} & ButtonHTMLAttributes

export const ButtonIcon = defineComponent<Props>((props) => () => (
  <ButtonBase
    class={['ButtonIcon', {
      'ButtonIcon--shiftOnClick': props.shiftOnClick,
      'ButtonIcon--stretched': props.stretched,
      'ButtonIcon--hoverBackground': props.withHoverBackground,
      'ButtonIcon--loading': props.loading
    }]}
  >
    <span class="ButtonIcon__in">
      {props.icon}
    </span>
    {props.loading && <Spinner class="ButtonIcon__spinner" color="inherit" />}
  </ButtonBase>
), {
  props: ['icon', 'stretched', 'withHoverBackground', 'loading', 'shiftOnClick']
})
