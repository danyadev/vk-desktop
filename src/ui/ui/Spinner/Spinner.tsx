import './Spinner.css'
import { defineComponent } from 'vue'
import {
  Icon16Spinner,
  Icon24Spinner,
  Icon32Spinner,
  Icon44Spinner
} from 'assets/icons'

type Props = {
  size?: 'small' | 'regular' | 'medium' | 'large'
}

export const Spinner = defineComponent<Props>(({ size = 'small' }) => {
  const SpinnerIcon = {
    small: Icon16Spinner,
    regular: Icon24Spinner,
    medium: Icon32Spinner,
    large: Icon44Spinner
  }[size]

  return () => (
    <SpinnerIcon class="Spinner" />
  )
})

Spinner.props = ['size']
