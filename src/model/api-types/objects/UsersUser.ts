export type UsersUser = {
  id: number
  first_name: string
  last_name: string
  /** Закрыта ли страница. Не возвращается, если пользователь удален или заблокирован */
  is_closed?: boolean
  /** Есть ли доступ к странице. Не возвращается, если пользователь удален или заблокирован */
  can_access_closed?: boolean
  deactivated?: 'deleted' | 'banned'
}
