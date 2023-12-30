export type GroupsGroup = {
  id: number
  name: string
  screen_name: string
  is_closed: 0 | 1 | 2
  type?: 'group' | 'page' | 'event'
  is_admin?: 0 | 1
  admin_level?: 1 | 2 | 3
  is_member?: 0 | 1
  is_advertiser?: 0 | 1
  photo_50?: string
  photo_100?: string
}
