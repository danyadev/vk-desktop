export type GroupsGroup = {
  id: number
  name: string
  screen_name: string
  type: 'group' | 'page' | 'event'
  is_closed: 0 | 1 | 2
  is_member: 0 | 1
  is_advertiser: 0 | 1
  is_admin: 0 | 1
  admin_level?: 1 | 2 | 3
  photo_50?: string
  photo_100?: string
  photo_base?: string
}
