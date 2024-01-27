import { defineComponent } from 'vue'
import { ClassName } from 'misc/utils'
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

function shortenCount(count: number) {
  switch (true) {
    case count > 1e9:
      return divideCount(count, 1e9) + 'B'
    case count > 1e6:
      return divideCount(count, 1e6) + 'M'
    case count > 1e3:
      return divideCount(count, 1e3) + 'K'
    default:
      return count
  }
}

// Аналог (dividend / divisor).toFixed(1), но с округлением в меньшую сторону
function divideCount(dividend: number, divisor: number): number {
  /**
   * Например, нам дано dividend = 2197, divisor = 1000, и мы хотим получить 2.1
   * Значит нам нужно из 2197 вычесть 97 и поделить число на 1000.
   * 2197 % 100 = 97, значит формула dividend % (divisor / 10)
   */
  return (dividend - (dividend % (divisor / 10))) / divisor
}
