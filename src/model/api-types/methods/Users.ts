import { UsersUser } from 'model/api-types/objects/UsersUser'

// users.get
export type UsersGetParams = {
  user_ids?: string | number
  domains?: string
  fields: string
}

export type UsersGetResponse = UsersUser[]
