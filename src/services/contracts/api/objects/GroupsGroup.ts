import { BaseCropPhoto } from 'services/contracts/api/objects/BaseCropPhoto'

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
  photo_200?: string
  photo_max_orig?: string
  /** Can be used to retrieve any crop in the crop grid. Defaults to the max crop */
  photo_base?: string
  /** Is not available for closed profiles */
  crop_photo?: BaseCropPhoto
  phone?: string
  status?: string
  description?: string
  activity?: string
  is_messages_blocked?: 0 | 1
  city?: { title: string }
  country?: { title: string }
  site?: string
  /** Не приходит, если сообщество забанено */
  members_count?: number
}
