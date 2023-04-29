import './FocusVisible.css'

import { defineComponent } from 'vue'

type Props = {
  isFocused: boolean
  outside?: boolean
}

export const FocusVisible = defineComponent<Props>((props) => {
  return () => (
    <span
      class={[
        'FocusVisible',
        props.outside && 'FocusVisible--outside',
        props.isFocused && 'FocusVisible--active'
      ]}
    />
  )
})

FocusVisible.props = ['isFocused', 'outside']
