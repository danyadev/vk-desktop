import { defineComponent, useId } from 'vue'

type Props = {
  withUnlistenedDot?: boolean
}

export const Icon32PauseCircle = defineComponent<Props>((props) => {
  const id = useId()

  return () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      {props.withUnlistenedDot && (
        <mask id={id}>
          <rect width="100%" height="100%" fill="white" />
          <circle cx="27" cy="27" r="5" />
        </mask>
      )}
      <path mask={`url(#${id})`} d="M32 16a16 16 0 1 1-32 0 16 16 0 0 1 32 0zm-20.9-5.45c-.1.21-.1.49-.1 1.05v8.8c0 .56 0 .84.1 1.05a1 1 0 0 0 .45.44c.21.11.49.11 1.05.11h.8c.56 0 .84 0 1.05-.1a1 1 0 0 0 .44-.45c.11-.21.11-.49.11-1.05v-8.8c0-.56 0-.84-.1-1.05a1 1 0 0 0-.45-.44c-.21-.11-.49-.11-1.05-.11h-.8c-.56 0-.84 0-1.05.1a1 1 0 0 0-.44.45zm6 0c-.1.21-.1.49-.1 1.05v8.8c0 .56 0 .84.1 1.05a1 1 0 0 0 .45.44c.21.11.49.11 1.05.11h.8c.56 0 .84 0 1.05-.1a1 1 0 0 0 .44-.45c.11-.21.11-.49.11-1.05v-8.8c0-.56 0-.84-.1-1.05a1 1 0 0 0-.45-.44c-.21-.11-.49-.11-1.05-.11h-.8c-.56 0-.84 0-1.05.1a1 1 0 0 0-.44.45z" fill="currentColor" />
      {props.withUnlistenedDot && <circle cx="27" cy="27" r="3" fill="currentColor" />}
    </svg>
  )
}, {
  props: ['withUnlistenedDot']
})
