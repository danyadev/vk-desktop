import { defineComponent } from 'vue'
import { ClassName } from 'misc/utils'
import { Icon24Cancel, Icon24RefreshOutline } from 'assets/icons'
import './CircleProgressBar.css'

type Props = {
  /** Значение от 0 до 1 */
  progress: number
  onCancel?: () => void
  class?: ClassName
} & (
  | { showRetry: boolean, onRetry: () => void }
  | { showRetry?: never, onRetry?: never }
)

export const CircleProgressBar = defineComponent<Props>((props) => {
  return () => {
    const size = 48
    const strokeWidth = 6
    const radius = (size - strokeWidth) / 2
    const circumference = radius * Math.PI * 2
    const dash = props.progress * circumference

    return (
      <div class="CircleProgressBar" onClick={props.showRetry ? props.onRetry : props.onCancel}>
        {!props.showRetry && props.onCancel && <Icon24Cancel />}
        {props.showRetry ? (
          <Icon24RefreshOutline />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.4)"
              stroke-width={strokeWidth}
              stroke-linecap="round"
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#fff"
              stroke-width={strokeWidth}
              stroke-linecap="round"
              stroke-dasharray={`${dash} ${circumference - dash}`}
              fill="none"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dasharray var(--slowTransition)'
              }}
            />
          </svg>
        )}
      </div>
    )
  }
}, {
  props: ['progress']
})
