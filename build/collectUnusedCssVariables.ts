import fs from 'fs/promises'
import path from 'path'
import {
  getDeclarationVarObject
} from '@vkontakte/vkui-tokens/themes/vkBase/cssVars/declarations/onlyVariables.js'

export async function collectUnusedCssVariables(mode: string) {
  if (mode === 'development') {
    return []
  }

  const declaration = getDeclarationVarObject()
  const variables = Object.keys(declaration)
  const usedVariables = await getUsedVariables(variables)

  return variables.filter((variable) => !usedVariables.has(variable))
}

async function getUsedVariables(variables: string[]) {
  const usedVariableNames = new Set()

  const allFileNames = await fs.readdir('./src', { recursive: true })
  const fileNames = allFileNames.filter((name) => {
    if (name.startsWith('assets') || name.startsWith('model')) {
      return false
    }

    return name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.css')
  })

  await Promise.all(
    fileNames.map(async (fileName) => {
      const content = await fs.readFile(path.join('./src', fileName), 'utf-8')
      for (const variable of variables) {
        if (content.includes(variable)) {
          usedVariableNames.add(variable)
        }
      }
    })
  )

  return usedVariableNames
}
