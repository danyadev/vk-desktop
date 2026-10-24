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
  'online_info',
  'blacklisted_by_me',
  'is_messages_blocked'
].join(',')

export const PEER_USER_EXTRA_FIELDS = [
  'first_name_acc',
  'last_name_acc',
  'photo_50',
  'photo_100',
  'photo_200',
  'crop_photo',
  'sex',
  'online_info',
  'screen_name',
  'contacts',
  'status',
  'bdate',
  'city',
  'country',
  'site',
  'career',
  'universities',
  'followers_count',
  'deactivated',
  'blacklisted_by_me'
].join(',')

export const PEER_GROUP_EXTRA_FIELDS = [
  'photo_50',
  'photo_100',
  'photo_200',
  'crop_photo',
  'members_count',
  'screen_name',
  'phone',
  'status',
  'description',
  'activity',
  'city',
  'country',
  'site',
  'is_messages_blocked'
].join(',')

export const CONVOS_PER_PAGE = 20
export const MAX_PINNED_CONVOS = 5
export const INTEGER_BOUNDARY = (2 ** 31) - 1
