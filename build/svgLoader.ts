import { promises as fs } from 'fs'
import { Plugin } from 'vite'

import { compileTemplate } from '@vue/compiler-sfc'

type Options = {
  defaultImport?: 'url' | 'raw' | 'component'
}

const svgRegex = /\.svg(\?(url|raw|component))?$/

export function svgLoader({ defaultImport }: Options = {}): Plugin {
  return {
    name: 'svg-loader',
    enforce: 'pre',

    async load(id) {
      if (!id.match(svgRegex)) {
        return
      }

      const [path, query] = id.split('?', 2)
      const importType = query ?? defaultImport

      if (!path || !importType || importType === 'url') {
        return // Use default svg loader
      }

      let svg

      try {
        svg = await fs.readFile(path, 'utf-8')
      } catch {
        console.warn('\n', `${id} couldn't be loaded by svg-loader, fallback to default loader`)
        return
      }

      if (importType === 'raw') {
        return `export default ${JSON.stringify(svg)}`
      }

      const { code } = compileTemplate({
        source: svg,
        filename: path,
        id: JSON.stringify(id),
        transformAssetUrls: false
      })

      return `${code}\nexport default { render }`
    }
  }
}
