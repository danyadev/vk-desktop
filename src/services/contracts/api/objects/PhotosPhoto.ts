import { PhotosPhotoSize } from 'services/contracts/api/objects/PhotosPhotoSize'

export type PhotosPhoto = {
  id: number
  owner_id: number
  access_key?: string
  album_id: number
  date: number
  sizes?: PhotosPhotoSize[]
  orig_photo?: PhotosPhotoSize
  thumb_hash?: string
  web_view_token?: string
  has_tags: boolean
  text?: string
}
