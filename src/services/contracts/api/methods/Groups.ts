import { GroupsGroup } from 'services/contracts/api/objects/GroupsGroup'
import { UsersUser } from 'services/contracts/api/objects/UsersUser'

// groups.getById
export type GroupsGetByIdParams = {
  group_ids: string | number
  fields: string
}

export type GroupsGetByIdResponse = {
  groups: GroupsGroup[]
  profiles: UsersUser[]
}
