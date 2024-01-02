import { GroupsGroup } from 'model/api-types/objects/GroupsGroup'
import { UsersUser } from 'model/api-types/objects/UsersUser'

// groups.getById
export type GroupsGetByIdParams = {
  group_ids: string | number
  fields?: string
}

export type GroupsGetByIdResponse = {
  groups: GroupsGroup[]
  profiles: UsersUser[]
}
