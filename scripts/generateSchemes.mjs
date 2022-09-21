import fs from 'fs'
import path from 'path'

/**
 * Код для генерации был взят отсюда:
 * https://github.com/VKCOM/vkjs/blob/9e0d19dd53840b4e15cfd1509e9fa28191beeeb4/build/tasks/generate_scheme.js
 */

/**
 * @param palette {object} палитра цветов
 * @param clusterData {{ color_identifier: string, alpha_multiplier: number }}
 * @return {string} цвет в браузерном представлении
 */
function resolveColor(palette, clusterData) {
  const color = palette[clusterData.color_identifier]
  const alphaMultiplier = clusterData.alpha_multiplier ? Number(clusterData.alpha_multiplier) : 1

  if (!color) {
    console.log('Missing color:', clusterData.color_identifier)
    return '#000'
  }

  if (color.indexOf('#') === 0 && color.length === 9) { // ahex
    return ahex2rgba(color.replace('#', ''), alphaMultiplier)
  } else if (color.indexOf('#') === 0 && clusterData.alpha_multiplier) {
    return opacify(color.replace('#', ''), alphaMultiplier)
  }

  return color
}

/**
 * @param ahex {string} цвет в формате ahex: 00ffffff
 * @param multiplier {number}
 * @return {string} цвет в формате rgba
 */
function ahex2rgba(ahex, multiplier) {
  const opacity = parseInt(ahex.slice(0, 2), 16) / 255 * multiplier
  const colorHex = ahex.slice(2)
  return opacify(colorHex, opacity)
}

/**
 * @param hex {string} цвет в формате hex: ffffff
 * @param opacity {number} прозрачность в диапазоне [0, 1]
 * @return {string} цвет в формате rgba
 */
function opacify(hex, opacity) {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4), 16)
  const a = +opacity.toFixed(2)

  return `rgba(${[r, g, b, a].join(', ')})`
}

/**
 * @param scheme {object} схема
 * @param palette {object} палитра
 * @param targetDir {string} папка сохранения схемы
 */
function generateScheme(scheme, palette, targetDir) {
  for (const schemeId in scheme) {
    const clusters = scheme[schemeId].colors
    const cssLines = [
      '/* stylelint-disable */',
      '/**',
      ' * Этот файл сгенерирован автоматически. Не нужно править его руками.',
      ' */',
      `[data-scheme="${schemeId}"] {`
    ]
    Object.keys(clusters).sort((a, b) => a.localeCompare(b)).forEach((clusterId) => {
      cssLines.push(
        `  --${clusterId}: ${resolveColor(palette, clusters[clusterId]).toLowerCase()};`
      )
    })
    cssLines.push('}')
    fs.writeFileSync(path.resolve(targetDir, `${schemeId}.css`), cssLines.join('\n') + '\n')
  }
}

/**
 * @param filename {string}
 * @returns {Object}
 */
function getStyleObject(filename) {
  const fileContents = fs.readFileSync(
    path.resolve(
      process.cwd(),
      './node_modules/@vkontakte/appearance/main.valette',
      filename
    ),
    'utf-8'
  )

  return JSON.parse(fileContents)
}

const schemeVKUI = getStyleObject('scheme.json')
const paletteVKUI = getStyleObject('palette.json')
const schemeWeb = getStyleObject('scheme_web.json')
const paletteWeb = getStyleObject('palette_web.json')

const stylesDir = path.resolve(process.cwd(), './src/schemes')

generateScheme(schemeVKUI, paletteVKUI, stylesDir)
generateScheme(schemeWeb, paletteWeb, stylesDir)
