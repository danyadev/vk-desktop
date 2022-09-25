import * as electron from '@electron/remote'

export const currentWindow = electron.getCurrentWindow()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function exhaustivenessCheck(_unused: never): never {
  throw new Error('Exhaustiveness failure! This should never happen.')
}
