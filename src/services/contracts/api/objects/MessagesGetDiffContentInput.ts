export type MessagesGetDiffContentInput = Array<{
  peer_id: number
  cmid_mark?: number
  offset?: number
  limit?: number
  cmids_ranges?: Array<{ min: number, max: number }>
  updated_cmids?: number[]
  cmids_updated_reactions?: number[]
}>
