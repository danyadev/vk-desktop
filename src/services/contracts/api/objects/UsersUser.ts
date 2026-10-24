import { BaseCropPhoto } from 'services/contracts/api/objects/BaseCropPhoto'

export type UsersUser = {
  id: number
  first_name: string
  first_name_acc: string
  last_name: string
  last_name_acc: string
  is_closed: boolean
  can_access_closed: boolean
  deactivated?: 'deleted' | 'banned'
  blacklisted_by_me?: 0 | 1
  photo_50?: string
  photo_100?: string
  photo_200?: string
  photo_max_orig?: string
  /** Can be used to retrieve any crop in the crop grid. Defaults to the max crop */
  photo_base?: string
  /** Is not available for closed profiles */
  crop_photo?: BaseCropPhoto
  screen_name?: string
  mobile_phone?: string
  status?: string
  bdate?: string
  city?: { title: string }
  country?: { title: string }
  site?: string
  followers_count?: number
  career?: Array<{ company?: string, position?: string, until?: number }>
  universities?: Array<{ name?: string }>
  online_info?: {
    visible: boolean
    last_seen?: number
    is_online?: boolean
    is_mobile?: boolean
    status?: 'recently' | 'last_week' | 'last_month' | 'long_ago' | 'not_show'
    app_id?: number
  }
  /** 0 — unknown, 1 — female, 2 — male */
  sex: 0 | 1 | 2
}
