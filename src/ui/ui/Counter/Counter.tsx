import { defineComponent } from 'vue'
import { ClassName } from 'misc/utils'
import { shortenCount } from 'misc/dateTime'
import './Counter.css'

type Props = {
  class?: ClassName
  count: number
  mode?: 'primary' | 'secondary'
}

export const Counter = defineComponent<Props>((props) => {
  return () => {
    if (props.count === 0) {
      return
    }

    return (
      <div class={['Counter', props.mode === 'secondary' && 'Counter--secondary']}>
        {shortenCount(props.count)}
      </div>
    )
  }
}, {
  props: ['mode', 'count']
})
