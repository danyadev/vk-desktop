import { computed, defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { useGlobalModal } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { AttachGif } from './AttachGif'
import { generateMediaLayout } from './generateMediaLayout'
import { Image } from 'ui/ui/Image/Image'
import { Icon24Play } from 'assets/icons'
import './AttachMedia.css'

type Props = {
  media: NonEmptyArray<Attach.Media>
  isOnly: boolean
}

type MediaLayoutItem = ReturnType<typeof generateMediaLayout>[number][number]

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remaining = String(seconds % 60).padStart(2, '0')
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${remaining}`
    : `${minutes}:${remaining}`
}

export const AttachMedia = defineComponent<Props>((props) => {
  const layout = computed(() => generateMediaLayout(props.media))
  const { photoViewerModal } = useGlobalModal()

  const renderItem = ({ media, width, height }: MediaLayoutItem) => {
    switch (media.kind) {
      case 'Photo':
        return (
          <Image
            key={Attach.id(media)}
            class="AttachMedia__item"
            src={media.image.url}
            previewSrc={media.sizes.get('s')?.url}
            width={width}
            height={height}
            onClick={() => photoViewerModal.open({ url: media.image.url })}
          />
        )

      case 'Video':
        return (
          <a
            key={Attach.id(media)}
            class="AttachMedia__item AttachMedia__video"
            style={{ aspectRatio: width / height }}
            href={media.playerUrl ?? `https://vk.com/video${media.ownerId}_${media.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {media.thumbnail && (
              <Image
                class="AttachMedia__image"
                src={media.thumbnail.url}
                width={width}
                height={height}
              />
            )}
            <span class="AttachMedia__play"><Icon24Play /></span>
            {media.duration > 0 && (
              <span class="AttachMedia__duration">{formatDuration(media.duration)}</span>
            )}
          </a>
        )

      case 'Gif':
        return (
          <AttachGif
            key={Attach.id(media)}
            gif={media}
            width={width}
            height={height}
            isOnly={props.isOnly}
          />
        )
    }
  }

  return () => (
    <div class="AttachMedia">
      {layout.value.map((row) => (
        <span class="AttachMedia__row">
          {row.map(renderItem)}
        </span>
      ))}
    </div>
  )
}, {
  props: ['media', 'isOnly']
})
