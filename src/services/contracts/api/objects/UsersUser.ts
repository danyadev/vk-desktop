export type UsersUser = {
  id: number
  first_name: string
  first_name_acc: string
  last_name: string
  last_name_acc: string
  is_closed: boolean
  can_access_closed: boolean
  deactivated?: 'deleted' | 'banned'
  photo_50?: string
  photo_100?: string
  photo_base?: string
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
