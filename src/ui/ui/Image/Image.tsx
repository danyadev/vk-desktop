import { defineComponent, ImgHTMLAttributes, shallowRef } from 'vue'
import { ClassName } from 'misc/utils'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24DownloadOutline } from 'assets/icons'
import './Image.css'

type ImageProps = Omit<ImgHTMLAttributes, 'class'> & {
  src: string
  previewSrc?: string
  width: number
  height: number
  class?: ClassName
}

/**
 * Rich компонент картинки, улучшающий и облегчающий отрисовку
 *
 * — Добавляет прозрачный плейсхолдер, поддерживающий размер и форму картинки, пока сама картинка
 * еще загружается, не мешая видеть постепенную загрузку картинки. Это предотвращает всевозможные
 * скачки при загрузке
 *
 * — Рисует заблюренную фотографию в минимальном разрешении, выступая в качестве превью
 * пока основная более тяжелая фотография загружается. Основная картинка будет постепенно
 * рисоваться поверх заблюренной фотографии
 *
 * — Обрабатывает ошибку загрузки картинки и позволяет повторить загрузку
 */
export const Image = defineComponent<ImageProps>((props, { attrs }) => {
  const $img = shallowRef<HTMLImageElement>()
  const placeholderUrl = generateSvgPlaceholderUrl(props.width, props.height)
  const isLoaded = shallowRef(false)
  const isFailed = shallowRef(false)
  const isPreviewFailed = shallowRef(false)

  return () => (
    <div
      class={['Image', !isLoaded.value && 'Image--loading', props.class]}
      style={{ aspectRatio: props.width / props.height }}
      onClick={() => (isFailed.value = false)}
    >
      {!isLoaded.value && <img class="Image__placeholderImg" src={placeholderUrl} />}

      {props.previewSrc &&
        props.previewSrc !== props.src &&
        !isLoaded.value &&
        !isPreviewFailed.value && (
        <img
          class="Image__previewImg"
          src={props.previewSrc}
          // Симулируем поведение object-fit: scale-down, но с заданным нами размером
          style={{ maxWidth: props.width + 'px', maxHeight: props.height + 'px' }}
          loading="lazy"
          decoding="async"
          onError={() => (isPreviewFailed.value = true)}
        />
      )}

      {!isFailed.value && (
        <img
          ref={$img}
          class="Image__img"
          loading="lazy"
          decoding="async"
          onLoad={() => (isLoaded.value = true)}
          onError={() => (isFailed.value = true)}
          {...attrs}
        />
      )}

      {isFailed.value && (
        <ButtonIcon
          class="Image__reloadButton"
          icon={<Icon24DownloadOutline width={20} height={20} />}
        />
      )}
    </div>
  )
}, {
  props: ['previewSrc', 'width', 'height', 'class'],
  inheritAttrs: false
})

const generateSvgPlaceholderUrl = (width: number, height: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" />`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
