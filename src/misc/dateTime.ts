export const ONE_MINUTE = 60 * 1000
export const ONE_HOUR = 60 * ONE_MINUTE
export const ONE_DAY = 24 * ONE_HOUR
export const ONE_WEEK = 7 * ONE_DAY
export const ONE_MONTH = 30 * ONE_DAY

export function shortenCount(count: number) {
  // Аналог (dividend / divisor).toFixed(1), но с округлением в меньшую сторону
  const divideCount = (dividend: number, divisor: number): number => {
    /**
     * Например, нам дано dividend = 2197, divisor = 1000, и мы хотим получить 2.1
     * Значит нам нужно из 2197 вычесть 97 и поделить число на 1000.
     * 2197 % 100 = 97, значит формула dividend % (divisor / 10)
     */
    return (dividend - (dividend % (divisor / 10))) / divisor
  }

  switch (true) {
    case count > 1e9:
      return divideCount(count, 1e9) + 'B'
    case count > 1e6:
      return divideCount(count, 1e6) + 'M'
    case count > 1e3:
      return divideCount(count, 1e3) + 'K'
    default:
      return count
  }
}

function copyDate(date: Date) {
  return new Date(date.getTime())
}

function startOfDay(date: Date) {
  const copy = new Date(date.getTime())
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function isSameDay(newerDate: Date, olderDate: Date) {
  return startOfDay(newerDate).getTime() === startOfDay(olderDate).getTime()
}

export function isPreviousDay(newerDate: Date, olderDate: Date) {
  const previousDate = copyDate(newerDate)
  previousDate.setDate(newerDate.getDate() - 1)

  return isSameDay(previousDate, olderDate)
}
