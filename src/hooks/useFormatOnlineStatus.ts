import { useServices } from 'services'
import * as Peer from 'model/Peer'
import { exhaustivenessCheck } from 'misc/utils'
import { useFormatDate } from './useFormatDate'

export const useFormatOnlineStatus = () => {
  const { lang } = useServices()
  const formatDate = useFormatDate()

  return (user: Peer.User): string => {
    const { isOnline, status, lastSeen } = user.onlineInfo

    if (isOnline) {
      return lang.use('me_user_online')
    }

    if (lastSeen) {
      return lang.useGender('me_user_was_online_at', user.gender, {
        time: formatDate(lastSeen)
      })
    }

    switch (status) {
      case 'recently':
        return lang.useGender('me_user_was_online_recently', user.gender)
      case 'last_week':
        return lang.useGender('me_user_was_online_last_week', user.gender)
      case 'last_month':
        return lang.useGender('me_user_was_online_last_month', user.gender)
      case 'long_ago':
      case 'not_show':
      case undefined:
        return lang.useGender('me_user_was_online_a_long_time_ago', user.gender)
      default:
        exhaustivenessCheck(status)
        return lang.useGender('me_user_was_online_a_long_time_ago', user.gender)
    }
  }
}
