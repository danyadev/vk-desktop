import { ButtonHTMLAttributes, defineComponent } from 'vue'
import { ButtonBase } from 'ui/ui/ButtonBase/ButtonBase'
import './ButtonText.css'

type Props = ButtonHTMLAttributes

export const ButtonText = defineComponent<Props>((props, { slots }) => () => (
  <ButtonBase class="ButtonText" focusOutside>{slots.default?.()}</ButtonBase>
))
