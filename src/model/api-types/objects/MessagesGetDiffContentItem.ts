import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'

export type MessagesGetDiffContentItem = {
  peer_id: number
  messages?: MessagesMessage[]
  requested_messages?: MessagesMessage[]
  range_messages?: MessagesMessage[][]
  reactions?: Array<{
    cmid: number
    counters: Array<{
      reaction_id: number
      count: number
      user_ids: number[]
    }>
  }>
}
