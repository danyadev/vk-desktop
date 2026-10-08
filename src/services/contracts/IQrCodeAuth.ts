export type Event =
  | { kind: 'UrlAcquired', url: string }
  | { kind: 'VerificationRequested' }
  | { kind: 'Success', accessToken: string }
  | { kind: 'Error', message: string }
