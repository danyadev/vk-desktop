import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import './Info.css'

type Props = {
  text: string
  before?: JSXElement
}

export const Info = defineComponent<Props>((props) => {
  console.log(props)
  return () => (
    <div class="Info">
      {props.before && props.before}
      <span class="Info__text">{props.text}</span>
    </div>
  )
}, {
  props: ['text', 'before']
})
