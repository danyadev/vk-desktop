import { UsersUser } from 'services/contracts/api/objects/UsersUser'

// users.get
export type UsersGetParams = {
  user_ids?: string | number
  fields: string
}

export type UsersGetResponse = UsersUser[]
