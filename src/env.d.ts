/* eslint-disable */

declare module '*.svg' {
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const src: FunctionalComponent<SVGAttributes>
  // @ts-ignore
  export default svg
}
