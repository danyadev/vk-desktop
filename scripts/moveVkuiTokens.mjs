import fs from 'fs/promises'
import path from 'path'

import {
  getDeclarationVarObject as getVkBaseVariables
} from '@vkontakte/vkui-tokens/themes/vkBase/cssVars/declarations/onlyVariables.js'
import {
  getDeclarationVarObject as getVkBaseDarkVariables
} from '@vkontakte/vkui-tokens/themes/vkBaseDark/cssVars/declarations/onlyVariables.js'
import {
  getDeclarationVarObject as getVkComVariables
} from '@vkontakte/vkui-tokens/themes/vkCom/cssVars/declarations/onlyVariables.js'
import {
  getDeclarationVarObject as getVkComDarkVariables
} from '@vkontakte/vkui-tokens/themes/vkComDark/cssVars/declarations/onlyVariables.js'

/** @typedef {[string, Object.<string, string | number>]} Entry */
/** @type Entry[] */
const entries = [
  ['vkui-light', getVkBaseVariables()],
  ['vkui-dark', getVkBaseDarkVariables()],
  ['vkcom-light', getVkComVariables()],
  ['vkcom-dark', getVkComDarkVariables()]
]

const schemesDir = path.resolve(process.cwd(), './src/assets/schemes')

for (const [schemeName, variables] of entries) {
  const cssLines = [
    '/* stylelint-disable color-hex-length, value-keyword-case, number-max-precision */',
    '/* Этот файл сгенерирован с помощью scripts/generateSchemes.mjs */',
    `[data-scheme="${schemeName}"] {`
  ]

  for (const variable in variables) {
    cssLines.push(`  ${variable}: ${variables[variable]};`)
  }

  cssLines.push('}')
  await fs.writeFile(path.resolve(schemesDir, `${schemeName}.css`), cssLines.join('\n') + '\n')
}
