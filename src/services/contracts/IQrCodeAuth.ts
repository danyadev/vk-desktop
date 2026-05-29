export type Event =
  | { kind: 'UrlAcquired', url: string }
  | { kind: 'Success', accessToken: string }
  | { kind: 'Error', message: string }
