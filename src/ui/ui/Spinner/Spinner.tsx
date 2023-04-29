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

const spinnerIcons = {
  small: Icon16Spinner,
  regular: Icon24Spinner,
  medium: Icon32Spinner,
  large: Icon44Spinner
}

export const Spinner = defineComponent<Props>((props) => {
  return () => {
    const SpinnerIcon = spinnerIcons[props.size || 'small']
    return <SpinnerIcon class="Spinner" />
  }
})

Spinner.props = ['size']
