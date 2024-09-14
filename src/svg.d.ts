declare module '*.svg' {
  import { FunctionalComponent, SVGAttributes } from 'vue'

  const src: FunctionalComponent<SVGAttributes>

  // @ts-expect-error Переопределяем экспорт для svg файлов
  // eslint-disable-next-line import/no-unused-modules, import/no-default-export
  export default src
}
