import { useEnv, useNow } from 'hooks'
import { isPreviousDay, isSameDay, ONE_DAY, ONE_HOUR, ONE_MINUTE } from 'misc/dateTime'

type Options = {
  relativeTime?: boolean
}

export const useFormatDate = (options: Options = {}) => {
  const { lang } = useEnv()
  const now = useNow(10000)
  const { relativeTime = true } = options

  return (timestamp: number) => {
    const nowTimestamp = now.value

    const nowDate = new Date(nowTimestamp)
    const timestampDate = new Date(timestamp)

    const diff = nowTimestamp - timestamp
    const isSameYear = timestampDate.getFullYear() === nowDate.getFullYear()

    const time = lang.dateTimeFormatter({
      hour: 'numeric',
      minute: 'numeric'
    }).format(timestamp)

    switch (true) {
      case relativeTime && diff < ONE_MINUTE: {
        return lang.use('date_a_moment_ago')
      }

      case relativeTime && diff < ONE_HOUR: {
        return lang.usePlural('date_minutes_ago', Math.floor((diff % ONE_HOUR) / ONE_MINUTE))
      }

      case relativeTime && diff <= 3 * ONE_HOUR: {
        return lang.usePlural('date_hours_ago', Math.floor((diff % ONE_DAY) / ONE_HOUR))
      }

      case isSameDay(nowDate, timestampDate): {
        return lang.use('date_today_at_time', { time })
      }

      case isPreviousDay(nowDate, timestampDate): {
        return lang.use('date_yesterday_at_time', { time })
      }

      default: {
        const date = lang.dateTimeFormatter({
          day: 'numeric',
          month: 'long'
        }).format(timestamp)
        const year = timestampDate.getFullYear()

        return isSameYear
          ? lang.use('date_at_time', { date, time })
          : lang.use('date_at_time_with_year', { date, time, year })
      }
    }
  }
}
