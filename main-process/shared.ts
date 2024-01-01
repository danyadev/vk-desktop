import os from 'os'
import type { AppearanceScheme } from 'store/mainSettings'
import type { ActualTheme } from 'ui/app/App/useThemeScheme'

// Включаем кастомный тайтлбар только для винды < 10 версии
export const shouldUseCustomTitlebar = process.platform === 'win32' && parseInt(os.release()) < 10

export function getColorBackgroundContent(theme: ActualTheme, scheme: AppearanceScheme) {
  const key: `${typeof scheme}-${typeof theme}` = `${scheme}-${theme}`

  switch (key) {
    case 'vkcom-light':
    case 'vkui-light':
      return '#fff'
    case 'vkcom-dark':
      return '#222'
    case 'vkui-dark':
      return '#19191a'
  }
}
