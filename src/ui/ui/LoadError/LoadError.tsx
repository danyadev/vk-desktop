import { defineComponent } from 'vue'
import { useServices } from 'services'
import { ClassName } from 'misc/utils'
import { Button } from 'ui/ui/Button/Button'
import './LoadError.css'

type Props = {
  onRetry: () => void
  class?: ClassName
}

export const LoadError = defineComponent<Props>((props) => {
  const { lang } = useServices()

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
