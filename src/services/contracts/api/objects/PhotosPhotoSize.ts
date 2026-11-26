import { PhotosPhotoSizesType } from 'services/contracts/api/objects/PhotosPhotoSizesType'

export type PhotosPhotoSize = {
  type: PhotosPhotoSizesType
  url: string
  width: number
  height: number
}
