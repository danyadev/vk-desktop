import { UsersUser } from 'model/api-types/objects/UsersUser'

// users.get
export type UsersGetParams = {
  user_ids?: string | number
  user_id?: string | number
  domains?: string
  fields: string
}

export type UsersGetResponse = UsersUser[]
