import { computed, defineComponent, ImgHTMLAttributes, onBeforeMount, shallowRef } from 'vue'
import * as Attach from 'model/Attach'
import { useGlobalModal } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { generatePhotosLayout } from './generatePhotosLayout'
import './AttachPhotos.css'

type Props = {
  photos: NonEmptyArray<Attach.Photo>
}

export const AttachPhotos = defineComponent<Props>((props) => {
  const layout = computed(() => generatePhotosLayout(props.photos))
  const { photoViewerModal } = useGlobalModal()

  return () => (
    <div class="AttachPhotos">
      {layout.value.map((photos) => (
        <span class="AttachPhotos__row">
          {photos.map((photo) => (
            <StrongImage
              key={photo.photo.image.url}
              class="AttachPhoto"
              width={photo.width}
              height={photo.height}
              src={photo.photo.image.url}
              onClick={() => photoViewerModal.open({ photo: photo.photo })}
            />
          ))}
        </span>
      ))}
    </div>
  )
}, {
  props: ['photos']
})

type StrongImageProps = ImgHTMLAttributes & { src: string, width: number, height: number }

/**
 * У элемента фотографий есть особенность: она начинает занимать место только после получения
 * информации о размере изображения из самого файла, не учитывая width и height или aspect-ratio,
 * по крайней мере в текущей ситуации, когда нам в стилях нужно переопределить width и height
 * ради динамичности и подстраивания под рядом стоящие фотографии.
 * Получается, что не всегда есть возможность указать intrinsic размеры фотографии, и при загрузке
 * фотографии ее размер может скакать.
 * Этот компонент исправляет эту проблему - до загрузки размеров фотографии мы подменяем ссылку
 * на искусственно созданную, в которой вшиты нужные размеры, чтобы элемент всегда занимал ровно
 * столько места, сколько ему нужно
 */
const StrongImage = defineComponent<StrongImageProps>((props) => {
  const placeholder = generateSvgPlaceholder(props.width, props.height)
  const isLoaded = shallowRef(false)
  const isFailed = shallowRef(false)

  onBeforeMount(() => {
    const image = new Image()
    image.src = props.src
    image.decoding = 'async'

    if (image.width) {
      isLoaded.value = true
      return
    }

    image.decode()
      .then(() => (isLoaded.value = true))
      .catch(() => (isFailed.value = true))

    const pollDimensions = () => {
      if (image.width) {
        isLoaded.value = true
      }
      if (!isLoaded.value && !isFailed.value) {
        setTimeout(pollDimensions, 50)
      }
    }

    setTimeout(pollDimensions, 50)
  })

  return () => (
    <img
      src={isLoaded.value ? props.src : placeholder}
      width={props.width}
      height={props.height}
      decoding="async"
    />
  )
}, {
  props: ['src', 'width', 'height']
})

const generateSvgPlaceholder = (width: number, height: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" />`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
