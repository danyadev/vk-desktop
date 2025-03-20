import { defineComponent, SVGAttributes, useId } from 'vue'

type Props = SVGAttributes & { withUnlistenedDot?: boolean }

export const Icon32PlayCircle = defineComponent<Props>((props) => {
  const id = useId()

  return () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      {props.withUnlistenedDot && (
        <mask id={id}>
          <rect width="100%" height="100%" fill="white" />
          <circle cx="27" cy="27" r="5" />
        </mask>
      )}
      <path mask={`url(#${id})`} clip-rule="evenodd" d="M32 16c0 8.837-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0s16 7.163 16 16zm-9.851.874a1.005 1.005 0 0 0 0-1.739l-8.644-4.994a1.003 1.003 0 0 0-1.505.87v9.988c0 .773.836 1.256 1.505.87z" fill="currentColor" fill-rule="evenodd" />
      {props.withUnlistenedDot && <circle cx="27" cy="27" r="3" fill="currentColor" />}
    </svg>
  )
}, {
  props: ['withUnlistenedDot']
})
