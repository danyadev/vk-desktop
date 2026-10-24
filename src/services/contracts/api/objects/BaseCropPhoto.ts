import { PhotosPhoto } from 'services/contracts/api/objects/PhotosPhoto'

export type BaseCropPhoto = {
  photo: PhotosPhoto
  crop: { x: number, y: number, x2: number, y2: number }
  rect: { x: number, y: number, x2: number, y2: number }
}
