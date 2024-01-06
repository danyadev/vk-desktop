import { defineComponent } from 'vue'
import './Counter.css'

type Props = {
  mode?: 'primary' | 'secondary'
  count: number
}

export const Counter = defineComponent<Props>((props) => {
  return () => props.count > 0 && (
    <div class={['Counter', props.mode === 'secondary' && 'Counter--secondary']}>
      {props.count}
    </div>
  )
}, {
  props: ['mode', 'count']
})
