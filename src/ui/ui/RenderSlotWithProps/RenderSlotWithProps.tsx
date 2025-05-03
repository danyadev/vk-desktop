import { defineComponent, HTMLAttributes } from 'vue'

export const RenderSlotWithProps = defineComponent<HTMLAttributes>((props, { slots }) => {
  return () => {
    /**
     * Слот это всегда массив или undefined. Не знаю почему массив, там всегда один элемент.
     *
     * Этот один элемент это всегда фрагмент, поэтому мы сначала достаем его.
     *
     * А вот дети у фрагмента это как раз массив элементов, которые и были переданы в качестве
     * детей компоненту.
     * Важно: дети могут быть так же фрагментами или компонентами, которые начинаются с
     * фрагмента, и в таком случае реф будет на фрагменте, а не на нужном элементе,
     * а такого не следует допускать.
     *
     * Проблема в том, что если поставить реф на фрагмент, он будет указывать на пустую text ноду,
     * находящуюся перед содержимым фрагмента, а оно может быть как пустое, так и с несколькими
     * элементами, количество которых мы не знаем, что делает невозможным какое-либо взаимодействие
     * с этой пустой text нодой
     */
    const [fragment] = slots.default?.() ?? []

    if (!fragment || !Array.isArray(fragment.children)) {
      return fragment
    }

    if (fragment.children.length > 1) {
      throw new Error('RenderSlotWithProps expected 1 child, got: ' + fragment.children.length)
    }

    return fragment.children[0]
  }
})
