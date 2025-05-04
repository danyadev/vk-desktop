import { PhotosPhoto } from 'model/api-types/objects/PhotosPhoto'

// photos.getMessagesUploadServer
export type PhotosGetMessagesUploadServerParams = {
  peer_id: number
}

export type PhotosGetMessagesUploadServerResponse = {
  album_id: number
  upload_url: string
  user_id: number
  group_id?: number
}

// photos.saveMessagesPhoto
export type PhotosSaveMessagesPhotoParams = {
  server: number
  photo: string
  hash: string
}

export type PhotosSaveMessagesPhotoResponse = PhotosPhoto[]
