import { defineComponent } from 'vue'
import { JSXElement } from 'misc/utils'
import './ComposerAttachCard.css'

type Props = {
  icon: JSXElement
  image?: string
  title: string
  subtitle?: string
}

export const ComposerAttachCard = defineComponent<Props>((props) => {
  return () => (
    <div class="ComposerAttachCard">
      {props.image ? (
        <img class="ComposerAttachCard__image" src={props.image} />
      ) : (
        <div class="ComposerAttachCard__icon">{props.icon}</div>
      )}

      <div class="ComposerAttachCard__text">
        <div class="ComposerAttachCard__title" title={props.title}>{props.title}</div>
        <div class="ComposerAttachCard__subtitle" title={props.subtitle}>{props.subtitle}</div>
      </div>
    </div>
  )
}, {
  props: ['icon', 'image', 'title', 'subtitle']
})
