export type UsersUser = {
  id: number
  first_name: string
  first_name_acc: string
  last_name: string
  last_name_acc: string
  /** Закрыта ли страница. Не возвращается, если пользователь удален или заблокирован */
  is_closed?: boolean
  /** Есть ли доступ к странице. Не возвращается, если пользователь удален или заблокирован */
  can_access_closed?: boolean
  deactivated?: 'deleted' | 'banned'
  photo_50?: string
  photo_100?: string
  /** 0 — unknown, 1 — female, 2 — male */
  sex?: 0 | 1 | 2
}
