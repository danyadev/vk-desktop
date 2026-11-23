import { PhotosPhotoSizesType } from './PhotosPhotoSizesType'

// docs_doc (fields used by VK Desktop; see vk schema.zip)
export type DocsDoc = {
  id: number
  owner_id: number
  title: string
  size: number
  ext: string
  url?: string
  date: number
  type: number
  preview?: DocsDocPreview
  access_key?: string
  is_unsafe?: 0 | 1
  private_url?: string
}

export type DocsDocPreview = {
  photo?: { sizes?: DocsDocPreviewPhotoSize[] }
  video?: {
    src: string
    width: number
    height: number
    file_size: number
  }
}

type DocsDocPreviewPhotoSize = {
  src: string
  width: number
  height: number
  type: PhotosPhotoSizesType
}
