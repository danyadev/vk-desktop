import { defineComponent } from 'vue'
import { ButtonBase, ButtonBaseProps } from 'ui/ui/ButtonBase/ButtonBase'
import './ButtonText.css'

type Props = {
  underlineOnFocus?: boolean
} & ButtonBaseProps

export const ButtonText = defineComponent<Props>((props, { slots }) => () => (
  <ButtonBase
    class={['ButtonText', props.underlineOnFocus && 'ButtonText--underlineOnFocus']}
    focusStyle={props.underlineOnFocus ? 'none' : 'outside'}
  >
    {slots.default?.()}
  </ButtonBase>
), {
  props: ['underlineOnFocus']
})
