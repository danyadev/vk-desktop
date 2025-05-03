import { defineComponent } from 'vue'
import { useEnv } from 'hooks'
import { ClassName } from 'misc/utils'
import { Button } from 'ui/ui/Button/Button'
import './LoadError.css'

type Props = {
  onRetry: () => void
  class?: ClassName
}

export const LoadError = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  return () => (
    <div class="LoadError">
      {lang.use('load_error')}
      <Button onClick={props.onRetry}>
        {lang.use('retry_loading')}
      </Button>
    </div>
  )
}, {
  props: ['onRetry']
})
