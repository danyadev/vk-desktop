import { version } from '../../package.json'

export const isMacOS = process.platform === 'darwin'

export const androidUserAgent =
  `VKAndroidApp/7.43-14005 (Android 10; SDK 29; arm64-v8a; VK Desktop ${version}; ru; 2340x1080)`

export const userFields = 'photo_50,photo_100'
