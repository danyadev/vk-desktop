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

/**
 * Вызывает целевую функцию через delay мс после последнего вызова обертки
 */
export function debounce<T extends ((...args: never[]) => void)>(fn: T, delay: number) {
  let timerId: NodeJS.Timeout | null = null

  return function(this: unknown, ...args: Parameters<T>) {
    if (timerId) {
      clearTimeout(timerId)
    }

    timerId = setTimeout(() => {
      fn.apply(this, args)
      timerId = null
    }, delay)
  }
}
