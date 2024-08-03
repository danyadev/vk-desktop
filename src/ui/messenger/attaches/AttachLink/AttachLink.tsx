import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { Icon24LinkExternalOutline } from 'assets/icons'
import './AttachLink.css'

type Props = {
  link: Attach.Link
}

export const AttachLink = defineComponent<Props>((props) => {
  return () => {
    const image = props.link.imageSizes?.get('o')

    return (
      <div class="AttachLink">
        <div class={['AttachLink__photo', !image && 'AttachLink__photo--placeholder']}>
          {image ? (
            <img class="AttachLink__photoImg" src={image.url} />
          ) : (
            <Icon24LinkExternalOutline color="var(--vkui--color_icon_accent_themed)" />
          )}
        </div>

        <div class="AttachLink__title">{props.link.title}</div>
        <div class="AttachLink__caption">{props.link.caption}</div>
      </div>
    )
  }
}, {
  props: ['link']
})
