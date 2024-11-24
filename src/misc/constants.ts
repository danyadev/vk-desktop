import { version } from '../../package.json'

export const appVersion = version
export const isMacOS = __IS_MACOS__

export const appUserAgent = `VKDesktop/${version}`

export const PEER_FIELDS = [
  'first_name_acc',
  'last_name_acc',
  'photo_50',
  'photo_100',
  'sex',
  'members_count',
  'online_info'
].join(',')

export const CONVOS_PER_PAGE = 20
export const INTEGER_BOUNDARY = (2 ** 31) - 1
