export type MessagesFolder = {
  id: number
  name: string
  type: 'default' | 'business' | 'channels' | 'unread' | 'personal' | 'managed_groups'
  flags: number
  included_peer_ids?: number[]
  included_lists?: string[]
  random_id?: number
}
