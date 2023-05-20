import { defineComponent } from 'vue'
import './FocusVisible.css'

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
}, {
  props: ['isFocused', 'outside']
})
