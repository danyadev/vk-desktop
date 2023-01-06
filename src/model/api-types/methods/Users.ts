import { UsersUser } from 'model/api-types/objects/UsersUser'
import type { userFields } from 'misc/constants'

// users.get
export type UsersGetParams = {
  user_ids?: string | number
  user_id?: string | number
  domains?: string
  fields: typeof userFields
}

export type UsersGetResponse = UsersUser[]
