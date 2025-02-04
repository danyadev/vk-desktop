import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'

type Props = {
  id: string
  renderMask: () => JSXElement | undefined
  insert?: JSXElement
}

export const Icon32PlayCircle = defineComponent<Props>((props) => {
  return () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <mask id={props.id}>{props.renderMask()}</mask>
      <g mask={`url(#${props.id})`}>
        <path clip-rule="evenodd" d="M32 16c0 8.837-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0s16 7.163 16 16zm-9.851.874a1.005 1.005 0 0 0 0-1.739l-8.644-4.994a1.003 1.003 0 0 0-1.505.87v9.988c0 .773.836 1.256 1.505.87z" fill="currentColor" fill-rule="evenodd" />
      </g>
      {props.renderMask() && props.insert}
    </svg>
  )
}, {
  props: ['renderMask', 'id', 'insert']
})
