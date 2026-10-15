import { defineComponent } from 'vue'
import { ClassName } from 'misc/utils'
import { shortenCount } from 'misc/dateTime'
import './Counter.css'

type Props = {
  class?: ClassName
  count: number
  mode?: 'primary' | 'secondary'
  allowEmpty?: boolean
}

export const Counter = defineComponent<Props>((props) => {
  return () => {
    if (props.count === 0 && !props.allowEmpty) {
      return
    }

    return (
      <div
        class={[
          'Counter',
          props.mode === 'secondary' && 'Counter--secondary',
          props.count === 0 && 'Counter--empty'
        ]}
      >
        {props.count > 0 && shortenCount(props.count)}
      </div>
    )
  }
}, {
  props: ['mode', 'count', 'allowEmpty']
})
