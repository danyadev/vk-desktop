import { version } from '../../package.json'

export const isMacOS = __IS_MACOS__

export const appUserAgent = `VKDesktop/${version}`

export const androidUserAgent =
  `VKAndroidApp/7.43-14005 (Android 10; SDK 29; arm64-v8a; VK Desktop ${version}; ru; 2340x1080)`

export const PEER_FIELDS = [
  'photo_50',
  'photo_100'
].join(',')
