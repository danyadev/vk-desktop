// docs.add
export type DocsAddParams = {
  owner_id: number
  doc_id: number
  access_key?: string
}
export type DocsAddResponse = number

// docs.delete
export type DocsDeleteParams = {
  owner_id: number
  doc_id: number
}
export type DocsDeleteResponse = 1
