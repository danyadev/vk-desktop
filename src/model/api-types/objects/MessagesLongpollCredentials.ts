export type MessagesLongpollCredentials = {
  /** server url (without https:// protocol) */
  server: string
  key: string
  /** timestamp */
  ts: number
  /** persistent timestamp */
  pts: number
}
